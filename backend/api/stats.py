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

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Complaint).count()
    clusters = db.query(Cluster).all()

    by_urgency = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    by_dept = {}

    for c in clusters:
        if c.urgency in by_urgency:
            by_urgency[c.urgency] += 1
        by_dept[c.department] = by_dept.get(c.department, 0) + c.complaint_count

    return {
        "total_complaints": total,
        "total_clusters": len(clusters),
        "by_urgency": by_urgency,
        "by_dept": by_dept,
    }