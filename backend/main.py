"""
main.py — IssueRouter FastAPI application.

Exposes two sets of routes:
  1. DB-backed routes (clusters + stats) — from api/ routers
  2. Legacy ML-pipeline route (/api/process) — kept for backward compatibility
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── DB routers ─────────────────────────────────────────────────────────────
from api.clusters import router as clusters_router
from api.stats import router as stats_router

# ── DB setup ───────────────────────────────────────────────────────────────
from db.database import engine, Base

# ── Legacy ML pipeline ─────────────────────────────────────────────────────
try:
    from pipeline.main import process_post, load_all_models
    _pipeline_available = True
except ImportError:
    _pipeline_available = False

# ── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="IssueRouter API",
    description="Civic complaint routing backend — DB routes + legacy NLP pipeline",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ───────────────────────────────────────────────────────
app.include_router(clusters_router)
app.include_router(stats_router)


# ── Startup: create DB tables + warm ML models ─────────────────────────────
@app.on_event("startup")
def startup_event():
    print("[IssueRouter] Creating DB tables if not exist…")
    Base.metadata.create_all(bind=engine)
    print("[IssueRouter] DB ready.")

    if _pipeline_available:
        print("[IssueRouter] Loading ML models…")
        load_all_models()
        print("[IssueRouter] ML models ready.")
    else:
        print("[IssueRouter] Pipeline not available — skipping model load.")


# ── Health check ───────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
def home():
    return {
        "message": "IssueRouter backend is running",
        "pipeline": _pipeline_available,
    }


# ── Legacy ML endpoint ─────────────────────────────────────────────────────
class ComplaintRequest(BaseModel):
    text: str


@app.post("/api/process", tags=["pipeline"])
def process_complaint(req: ComplaintRequest):
    """
    (Legacy) Run a raw tweet text through the NLP pipeline.
    Returns category, urgency, department, location.
    Requires the pipeline/ module to be available.
    """
    if not _pipeline_available:
        return {"error": "ML pipeline not loaded. Run 'pip install -r requirements.txt' and ensure pipeline/ exists."}

    raw_tweet = {
        "id": "demo_id",
        "text": req.text,
        "user": "demo_user",
        "timestamp": "now",
    }
    return process_post(raw_tweet)