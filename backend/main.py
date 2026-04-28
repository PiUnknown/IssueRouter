"""
main.py — IssueRouter FastAPI application
Loads tweets.json → processes through NLP pipeline → outputs results
No database dependency. Pure pipeline processing.
"""
from dotenv import load_dotenv
load_dotenv()

import json
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent))

from pipeline.main import load_all_models, process_post
from ingestion.mock_feed import load_tweets

# ── FastAPI App ────────────────────────────────────────────────────
app = FastAPI(
    title="IssueRouter API",
    description="Civic complaint routing — NLP Pipeline (No DB)",
    version="1.0.0-dev",
)

# ── CORS Setup ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory storage for processed tweets ────────────────────────
processed_results = []

# ── Request/Response Models ────────────────────────────────────────
class ComplaintRequest(BaseModel):
    text: str

# ── Routes ────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
def home():
    """Health check endpoint."""
    return {
        "message": "IssueRouter pipeline is running",
        "status": "ok",
        "tweets_processed": len(processed_results)
    }

@app.post("/api/process", tags=["pipeline"])
def process_complaint(req: ComplaintRequest):
    """Process a single complaint text through the NLP pipeline."""
    raw_tweet = {
        "id": "demo_001",
        "username": "demo_user",
        "text": req.text,
        "likes": 0,
        "retweets": 0,
        "created_at": "now",
    }
    return process_post(raw_tweet)

@app.get("/api/results", tags=["results"])
def get_results(limit: int = 10):
    """Get last N processed tweets."""
    return {
        "total_processed": len(processed_results),
        "last": processed_results[-limit:] if processed_results else []
    }

@app.get("/api/results/export", tags=["results"])
def export_all_results():
    """Export all processed results."""
    return {
        "total": len(processed_results),
        "results": processed_results
    }

@app.get("/api/process-batch", tags=["batch"])
def process_batch():
    """Process all tweets from tweets.json."""
    global processed_results
    
    try:
        print("\n[API] Loading tweets...")
        tweets = load_tweets()
        print(f"[API] Loaded {len(tweets)} tweets")
        
        print("[API] Processing through pipeline...")
        processed_results = []
        
        for tweet in tweets:
            try:
                result = process_post(tweet)
                processed_results.append(result)
            except Exception as e:
                print(f"[API] Error processing tweet: {e}")
                continue
        
        print(f"[API] ✓ Processed {len(processed_results)} tweets")
        
        # Save to cache
        cache_path = Path(__file__).parent / "cache" / "summaries.json"
        cache_path.parent.mkdir(exist_ok=True)
        cache_path.write_text(json.dumps({
            "timestamp": "now",
            "total": len(processed_results),
            "results": processed_results
        }, indent=2))
        
        return {
            "status": "success",
            "total_processed": len(processed_results),
            "cache_path": str(cache_path)
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

# ── Startup Event ────────────────────────────────────────────────
@app.on_event("startup")
def startup_event():
    """Load models on startup."""
    print("\n[IssueRouter] Starting up...")
    print("[IssueRouter] Loading ML models...")
    try:
        load_all_models()
        print("[IssueRouter] ✓ Models loaded successfully.\n")
    except Exception as e:
        print(f"[IssueRouter] ✗ Error loading models: {e}\n")
