from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import Cluster, Action

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.put("/clusters/{cluster_id}/status")
def update_status(cluster_id: str, body: dict, db: Session = Depends(get_db)):
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    cluster.status = body.get("status", "pending")
    action = Action(cluster_id=cluster_id, action=cluster.status)
    db.add(action)
    db.commit()
    return {"success": True, "status": cluster.status}