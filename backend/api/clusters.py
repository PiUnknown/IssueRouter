from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import Cluster, Complaint

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/clusters")
def get_clusters(dept: str = None, urgency: str = None, db: Session = Depends(get_db)):
    query = db.query(Cluster)
    if dept:
        query = query.filter(Cluster.department == dept)
    if urgency:
        query = query.filter(Cluster.urgency == urgency)
    clusters = query.order_by(Cluster.priority_score.desc()).all()
    return {"clusters": [
        {
            "id": c.id,
            "problem": c.problem,
            "summary": c.summary,
            "location": c.location,
            "category": c.category,
            "department": c.department,
            "complaint_count": c.complaint_count,
            "rt_reach": c.rt_reach,
            "urgency": c.urgency,
            "priority_score": c.priority_score,
            "recommended_action": c.recommended_action,
            "status": c.status,
            "last_updated": str(c.last_updated),
        }
        for c in clusters
    ], "total": len(clusters)}

@router.get("/clusters/{cluster_id}")
def get_cluster(cluster_id: str, db: Session = Depends(get_db)):
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    tweets = db.query(Complaint).filter(Complaint.cluster_id == cluster_id).limit(5).all()
    return {
        "id": cluster.id,
        "problem": cluster.problem,
        "summary": cluster.summary,
        "location": cluster.location,
        "category": cluster.category,
        "department": cluster.department,
        "complaint_count": cluster.complaint_count,
        "urgency": cluster.urgency,
        "recommended_action": cluster.recommended_action,
        "status": cluster.status,
        "sample_tweets": [
            {"username": t.username, "text": t.raw_text}
            for t in tweets
        ]
    }