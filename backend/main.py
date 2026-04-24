from dotenv import load_dotenv
load_dotenv()

import threading
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pipeline.main import load_all_models, process_post
from ingestion.mock_feed import stream_mock_tweets
from db.database import engine, Base
from db.models import Complaint, Cluster
from db import database
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

# Allow React frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── THE MAIN CONNECTION FUNCTION ──
def process_and_save(raw_tweet: dict):
    """
    This is the callback that mock_feed.py calls for every tweet.
    1. Sends tweet through NLP pipeline
    2. Finds or creates a cluster
    3. Saves everything to DB
    """
    from db.database import SessionLocal
    from pipeline.clusterer import find_matching_cluster, update_centroid, get_embedding
    from pipeline.summariser import summarise_cluster, generate_recommended_action
    from db.models import Complaint, Cluster
    import uuid, json
    from datetime import datetime

    db = SessionLocal()

    try:
        # Step 1 — Run through your pipeline
        result = process_post(raw_tweet)

        # Step 2 — Check if complaint already exists (dedup)
        existing = db.query(Complaint).filter(
            Complaint.tweet_id == result["tweet_id"]
        ).first()
        if existing:
            print(f"[main] Duplicate tweet skipped: {result['tweet_id']}")
            return

        # Step 3 — Find matching cluster or create new one
        all_clusters = db.query(Cluster).all()
        clusters_for_matcher = [
            {
                "id": c.id,
                "category": c.category,
                "centroid_embedding": json.loads(c.centroid_embedding)
            }
            for c in all_clusters
        ]

        matched_cluster_id = find_matching_cluster(
            result["clean_text"],
            result["category"],
            clusters_for_matcher
        )

        if matched_cluster_id:
            # ── ADD TO EXISTING CLUSTER ──
            cluster = db.query(Cluster).filter(Cluster.id == matched_cluster_id).first()
            cluster.complaint_count += 1
            cluster.rt_reach += result["retweets"]

            # Update centroid
            old_centroid = json.loads(cluster.centroid_embedding)
            new_centroid = update_centroid(
                old_centroid,
                result["clean_text"],
                cluster.complaint_count
            )
            cluster.centroid_embedding = json.dumps(new_centroid)

            # Recalculate urgency weight and priority score
            cluster.priority_score = (
                cluster.complaint_count * 1.0 +
                cluster.rt_reach * 0.3 +
                result["urgency_weight"]
            )
            cluster.last_updated = datetime.utcnow()

            # Regenerate summary at milestones
            if cluster.complaint_count in [10, 50, 100, 250]:
                sample_texts = [
                    c.clean_text for c in
                    db.query(Complaint).filter(
                        Complaint.cluster_id == matched_cluster_id
                    ).limit(5).all()
                ]
                cluster.summary = summarise_cluster(
                    matched_cluster_id,
                    sample_texts,
                    cluster.location or "",
                    cluster.category,
                    cluster.complaint_count
                )

            complaint_cluster_id = matched_cluster_id

        else:
            # ── CREATE NEW CLUSTER ──
            new_cluster_id = f"CLU-{uuid.uuid4().hex[:6].upper()}"

            summary = summarise_cluster(
                new_cluster_id,
                [result["clean_text"]],
                result["location"] or "Unknown",
                result["category"],
                1
            )

            recommended_action = generate_recommended_action(
                result["category"],
                result["location"] or "Unknown",
                result["urgency"]
            )

            new_cluster = Cluster(
                id=new_cluster_id,
                problem=f"{result['category']} issue — {result['location'] or 'Unknown location'}",
                summary=summary,
                location=result["location"] or "Unknown",
                category=result["category"],
                department=result["department"],
                complaint_count=1,
                rt_reach=result["retweets"],
                urgency=result["urgency"],
                priority_score=1.0 + result["retweets"] * 0.3 + result["urgency_weight"],
                recommended_action=recommended_action,
                status="pending",
                centroid_embedding=json.dumps(result["embedding"]),
                last_updated=datetime.utcnow()
            )
            db.add(new_cluster)
            complaint_cluster_id = new_cluster_id

        # Step 4 — Save complaint to DB
        complaint = Complaint(
            tweet_id=result["tweet_id"],
            username=result["username"],
            raw_text=result["raw_text"],
            clean_text=result["clean_text"],
            cluster_id=complaint_cluster_id,
            category=result["category"],
            urgency=result["urgency"],
            location=result["location"],
            retweets=result["retweets"],
            likes=result["likes"],
        )
        db.add(complaint)
        db.commit()
        print(f"[main] ✓ Processed: {result['username']} → cluster {complaint_cluster_id}")

    except Exception as e:
        print(f"[main] Error processing tweet: {e}")
        db.rollback()
    finally:
        db.close()


# ── STARTUP: load models + start ingestion ──
@app.on_event("startup")
async def startup():
    # Create DB tables
    Base.metadata.create_all(bind=engine)

    # Warm up all ML models
    load_all_models()

    # Start mock feed in background thread
    # This reads tweets.json and calls process_and_save every 8 seconds
    thread = threading.Thread(
        target=stream_mock_tweets,
        args=(process_and_save,),
        kwargs={"interval_seconds": 8},
        daemon=True
    )
    thread.start()
    print("[main] Mock feed started. Reading from tweets.json...")


# ── ROUTES (Dev 1 fills these in) ──
from api.clusters import router as clusters_router
from api.actions import router as actions_router
from api.stats import router as stats_router

app.include_router(clusters_router)
app.include_router(actions_router)
app.include_router(stats_router)
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
