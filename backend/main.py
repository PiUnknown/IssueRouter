from fastapi import FastAPI
from pydantic import BaseModel

# import your pipeline
from pipeline.main import process_post, load_all_models

app = FastAPI()

# -------- Request Schema --------
class ComplaintRequest(BaseModel):
    text: str

# -------- Startup (load models once) --------
@app.on_event("startup")
def startup_event():
    print("[Backend] Starting up...")
    load_all_models()

# -------- Health Check --------
@app.get("/")
def home():
    return {"message": "IssueRouter backend is running"}

# -------- Main Processing Endpoint --------
@app.post("/api/process")
def process_complaint(req: ComplaintRequest):
    raw_tweet = {
        "id": "demo_id",
        "text": req.text,
        "user": "demo_user",
        "timestamp": "now"
    }

    result = process_post(raw_tweet)
    return result