"""
api/clusters.py — CRUD routes for complaint clusters.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from db.database import get_db
from db.models import Cluster, Complaint

router = APIRouter(prefix="/api/clusters", tags=["clusters"])

VALID_STATUSES = {"pending", "inprogress", "resolved"}

@router.get("/")
def list_clusters(
    status: Optional[str]     = Query(None, description="Filter by status: pending|inprogress|resolved"),
    department: Optional[str] = Query(None, description="Filter by department name"),
    urgency: Optional[str]    = Query(None, description="Filter by urgency"),
    search: Optional[str]     = Query(None, description="Search problem / location / cluster id"),
    skip: int                 = Query(0, ge=0),
    limit: int                = Query(200, ge=1, le=500),
    db: Session               = Depends(get_db),
):
    """Return all clusters matching optional filters, ordered by priority score then complaint_count."""
    q = db.query(Cluster)

    if status and status in VALID_STATUSES:
        q = q.filter(Cluster.status == status)
    if department:
        q = q.filter(Cluster.department == department)
    if urgency:
        q = q.filter(Cluster.urgency == urgency)
    if search:
        like = f"%{search}%"
        q = q.filter(
            Cluster.problem.ilike(like)
            | Cluster.location.ilike(like)
            | Cluster.id.ilike(like)
        )

    clusters = (
        q.order_by(Cluster.priority_score.desc(), Cluster.complaint_count.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return clusters

@router.get("/{cluster_id}")
def get_cluster(cluster_id: str, db: Session = Depends(get_db)):
    """Return a single cluster with its sample tweets."""
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail=f"Cluster {cluster_id!r} not found")
    
    tweets = db.query(Complaint).filter(Complaint.cluster_id == cluster_id).limit(5).all()
    
    return {
        **cluster.__dict__,
        "sample_tweets": [
            {"username": t.username, "text": t.raw_text}
            for t in tweets
        ]
    }

@router.patch("/{cluster_id}/status")
def update_status(
    cluster_id: str,
    status: str,
    db: Session = Depends(get_db),
):
    """Update the status of a cluster (pending → inprogress → resolved)."""
    if status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"Invalid status '{status}'")

    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail=f"Cluster {cluster_id!r} not found")

    cluster.status = status
    db.commit()
    db.refresh(cluster)
    return cluster
