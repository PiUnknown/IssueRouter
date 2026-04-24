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
"""
api/clusters.py — CRUD routes for complaint clusters.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from db.database import get_db
from db.models import Cluster, Tweet
from db.schemas import ClusterOut, ClusterStatusUpdate

router = APIRouter(prefix="/api/clusters", tags=["clusters"])

VALID_STATUSES = {"pending", "inprogress", "resolved"}


@router.get("/", response_model=List[ClusterOut])
def list_clusters(
    status: Optional[str]     = Query(None, description="Filter by status: pending|inprogress|resolved"),
    department: Optional[str] = Query(None, description="Filter by department name"),
    priority: Optional[int]   = Query(None, description="Filter by priority 1-4"),
    search: Optional[str]     = Query(None, description="Search problem / location / cluster_id"),
    skip: int                 = Query(0, ge=0),
    limit: int                = Query(200, ge=1, le=500),
    db: Session               = Depends(get_db),
):
    """Return all clusters matching optional filters, ordered by priority then complaint_count."""
    q = db.query(Cluster)

    if status and status in VALID_STATUSES:
        q = q.filter(Cluster.status == status)
    if department:
        q = q.filter(Cluster.department == department)
    if priority:
        q = q.filter(Cluster.priority == priority)
    if search:
        like = f"%{search}%"
        q = q.filter(
            Cluster.problem.ilike(like)
            | Cluster.location.ilike(like)
            | Cluster.cluster_id.ilike(like)
        )

    clusters = (
        q.order_by(Cluster.priority.asc(), Cluster.complaint_count.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return clusters


@router.get("/{cluster_id}", response_model=ClusterOut)
def get_cluster(cluster_id: str, db: Session = Depends(get_db)):
    """Return a single cluster with its sample tweets."""
    cluster = db.query(Cluster).filter(Cluster.cluster_id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail=f"Cluster {cluster_id!r} not found")
    return cluster


@router.patch("/{cluster_id}/status", response_model=ClusterOut)
def update_status(
    cluster_id: str,
    payload: ClusterStatusUpdate,
    db: Session = Depends(get_db),
):
    """Update the status of a cluster (pending → inprogress → resolved)."""
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"Invalid status '{payload.status}'")

    cluster = db.query(Cluster).filter(Cluster.cluster_id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail=f"Cluster {cluster_id!r} not found")

    cluster.status = payload.status
    db.commit()
    db.refresh(cluster)
    return cluster
