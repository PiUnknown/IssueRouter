"""
api/stats.py — Aggregated analytics endpoints for the dashboard.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List

from db.database import get_db
from db.models import Cluster
from db.schemas import (
    StatsOverviewOut,
    VelocityOut,
    DeptLoadOut,
    LocationsOut,
    LocationPointOut,
    PriorityLoadOut,
    PriorityBandOut,
)

router = APIRouter(prefix="/api/stats", tags=["stats"])

PRIORITY_LABELS = {
    1: "Critical (P1)",
    2: "High (P2)",
    3: "Medium (P3)",
    4: "Low (P4)",
}
DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


@router.get("/overview", response_model=StatsOverviewOut)
def overview(db: Session = Depends(get_db)):
    """Overall platform statistics."""
    total      = db.query(func.count(Cluster.cluster_id)).scalar() or 0
    pending    = db.query(func.count(Cluster.cluster_id)).filter(Cluster.status == "pending").scalar() or 0
    inprogress = db.query(func.count(Cluster.cluster_id)).filter(Cluster.status == "inprogress").scalar() or 0
    resolved   = db.query(func.count(Cluster.cluster_id)).filter(Cluster.status == "resolved").scalar() or 0

    total_complaints = db.query(func.sum(Cluster.complaint_count)).scalar() or 0
    avg_rt           = db.query(func.avg(Cluster.rt_reach)).scalar() or 0.0
    resolution_rate  = round((resolved / total * 100), 1) if total else 0.0

    return StatsOverviewOut(
        total_clusters=total,
        pending=pending,
        inprogress=inprogress,
        resolved=resolved,
        total_complaints=int(total_complaints),
        avg_rt_reach=round(float(avg_rt), 1),
        resolution_rate=resolution_rate,
    )


@router.get("/velocity", response_model=VelocityOut)
def velocity(db: Session = Depends(get_db)):
    """
    Complaint volume for each of the last 7 days.
    Groups clusters by their created_at date and sums complaint_count.
    """
    now   = datetime.now(timezone.utc).replace(tzinfo=None)
    days  = [now - timedelta(days=i) for i in range(6, -1, -1)]  # oldest → newest
    start = days[0].replace(hour=0, minute=0, second=0, microsecond=0)

    # Fetch all clusters created in the last 7 days
    rows = (
        db.query(Cluster.created_at, Cluster.complaint_count)
        .filter(Cluster.created_at >= start)
        .all()
    )

    # Bucket by day
    buckets = {d.strftime("%Y-%m-%d"): 0 for d in days}
    for created_at, count in rows:
        key = created_at.strftime("%Y-%m-%d")
        if key in buckets:
            buckets[key] += count

    counts = list(buckets.values())
    labels = [DAY_ABBR[d.weekday()] for d in days]
    avg    = round(sum(counts) / len(counts), 1) if counts else 0
    avg_line = [avg] * len(counts)

    return VelocityOut(labels=labels, complaints=counts, avg_line=avg_line)


@router.get("/dept-load", response_model=DeptLoadOut)
def dept_load(db: Session = Depends(get_db)):
    """Complaint count grouped by department, sorted descending."""
    rows = (
        db.query(Cluster.department, func.sum(Cluster.complaint_count).label("total"))
        .group_by(Cluster.department)
        .order_by(func.sum(Cluster.complaint_count).desc())
        .all()
    )
    return DeptLoadOut(
        labels=[r.department for r in rows],
        counts=[int(r.total) for r in rows],
    )


@router.get("/locations", response_model=LocationsOut)
def locations(
    top: int = Query(15, ge=5, le=50, description="How many top locations to return"),
    db: Session = Depends(get_db),
):
    """Top locations by complaint count with coordinates for the heatmap."""
    rows = (
        db.query(
            Cluster.location,
            Cluster.lat,
            Cluster.lng,
            Cluster.complaint_count,
            Cluster.priority,
        )
        .order_by(Cluster.complaint_count.desc())
        .limit(top)
        .all()
    )
    return LocationsOut(
        locations=[
            LocationPointOut(
                location=r.location,
                lat=r.lat,
                lng=r.lng,
                complaint_count=r.complaint_count,
                priority=r.priority,
            )
            for r in rows
        ]
    )


@router.get("/priority-load", response_model=PriorityLoadOut)
def priority_load(db: Session = Depends(get_db)):
    """Complaint count broken down by priority level."""
    rows = (
        db.query(Cluster.priority, func.sum(Cluster.complaint_count).label("total"))
        .group_by(Cluster.priority)
        .order_by(Cluster.priority.asc())
        .all()
    )
    total = sum(int(r.total) for r in rows) or 1
    priorities = [
        PriorityBandOut(
            label=PRIORITY_LABELS.get(r.priority, f"P{r.priority}"),
            count=int(r.total),
            pct=round(int(r.total) / total * 100, 1),
        )
        for r in rows
    ]
    return PriorityLoadOut(active_total=total, priorities=priorities)
