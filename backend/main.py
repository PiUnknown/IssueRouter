from dotenv import load_dotenv
load_dotenv()

import json
import uuid
import threading
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pipeline.main import load_all_models, process_post
from ingestion.db_feed import stream_from_db
from db.database import engine, Base, SessionLocal
from db.models import Complaint, Cluster, Action

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def process_and_save(raw_tweet: dict):
    from pipeline.clusterer import find_matching_cluster, update_centroid
    from pipeline.summariser import summarise_cluster, generate_recommended_action

    db = SessionLocal()

    try:
        # Step 1 — Run through pipeline
        result = process_post(raw_tweet)

        # Step 2 — Dedup check
        existing = db.query(Complaint).filter(
            Complaint.tweet_id == result["tweet_id"]
        ).first()
        if existing:
            print(f"[main] Duplicate skipped: {result['tweet_id']}")
            return

        # Step 3 — Find or create cluster
        all_clusters = db.query(Cluster).all()
        clusters_for_matcher = [
            {
                "id":                 c.id,
                "category":           c.category,
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
            cluster = db.query(Cluster).filter(
                Cluster.id == matched_cluster_id
            ).first()

            cluster.complaint_count += 1
            cluster.rt_reach        += result["retweets"]

            old_centroid = json.loads(cluster.centroid_embedding)
            new_centroid = update_centroid(
                old_centroid,
                result["clean_text"],
                cluster.complaint_count
            )
            cluster.centroid_embedding = json.dumps(new_centroid)
            cluster.priority_score = (
                cluster.complaint_count * 1.0 +
                cluster.rt_reach * 0.3 +
                result["urgency_weight"]
            )
            cluster.last_updated = datetime.utcnow()

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
                id                 = new_cluster_id,
                problem            = f"{result['category']} issue — {result['location'] or 'Unknown'}",
                summary            = summary,
                location           = result["location"] or "Unknown",
                category           = result["category"],
                department         = result["department"],
                complaint_count    = 1,
                rt_reach           = result["retweets"],
                urgency            = result["urgency"],
                priority_score     = 1.0 + result["retweets"] * 0.3 + result["urgency_weight"],
                recommended_action = recommended_action,
                status             = "pending",
                centroid_embedding = json.dumps(result["embedding"]),
                last_updated       = datetime.utcnow()
            )
            db.add(new_cluster)
            complaint_cluster_id = new_cluster_id

        # Step 4 — Save complaint
        complaint = Complaint(
            tweet_id   = result["tweet_id"],
            username   = result["username"],
            raw_text   = result["raw_text"],
            clean_text = result["clean_text"],
            cluster_id = complaint_cluster_id,
            category   = result["category"],
            urgency    = result["urgency"],
            location   = result["location"],
            retweets   = result["retweets"],
            likes      = result["likes"],
        )
        db.add(complaint)
        db.commit()
        print(f"[main] ✓ Saved: @{result['username']} → {complaint_cluster_id}")

    except Exception as e:
        print(f"[main] Error: {e}")
        db.rollback()
    finally:
        db.close()


@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    load_all_models()

    thread = threading.Thread(
        target=stream_from_db,
        args=(process_and_save,),
        kwargs={"interval_seconds": 8},
        daemon=True
    )
    thread.start()
    print("[main] DB feed started.")


from api.clusters import router as clusters_router
from api.actions  import router as actions_router
from api.stats    import router as stats_router

app.include_router(clusters_router)
app.include_router(actions_router)
app.include_router(stats_router)