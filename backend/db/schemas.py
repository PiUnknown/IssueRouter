"""
db/schemas.py — Pydantic response models for IssueRouter API.
"""
from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


# ── Tweet ──────────────────────────────────────────────────────────────────
class TweetOut(BaseModel):
    id: int
    handle: str
    text: str

    class Config:
        from_attributes = True


# ── Cluster ────────────────────────────────────────────────────────────────
class ClusterBase(BaseModel):
    cluster_id: str
    priority: int
    problem: str
    summary: str
    location: str
    lat: Optional[float]
    lng: Optional[float]
    department: str
    complaint_count: int
    rt_reach: int
    trend: str
    recommended_action: Optional[str]
    time_window: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ClusterOut(ClusterBase):
    sample_tweets: List[TweetOut] = []

    class Config:
        from_attributes = True


class ClusterStatusUpdate(BaseModel):
    status: str   # pending | inprogress | resolved


# ── Stats — overview ───────────────────────────────────────────────────────
class StatsOverviewOut(BaseModel):
    total_clusters: int
    pending: int
    inprogress: int
    resolved: int
    total_complaints: int
    avg_rt_reach: float
    resolution_rate: float   # 0–100 %


# ── Stats — velocity (last 7 days) ─────────────────────────────────────────
class VelocityOut(BaseModel):
    labels: List[str]        # ['Mon', 'Tue', …]
    complaints: List[int]    # complaint counts per day
    avg_line: List[float]    # flat 7-day average repeated


# ── Stats — department load ────────────────────────────────────────────────
class DeptLoadOut(BaseModel):
    labels: List[str]
    counts: List[int]


# ── Stats — location hotspots ──────────────────────────────────────────────
class LocationPointOut(BaseModel):
    location: str
    lat: Optional[float]
    lng: Optional[float]
    complaint_count: int
    priority: int


class LocationsOut(BaseModel):
    locations: List[LocationPointOut]


# ── Stats — priority load ──────────────────────────────────────────────────
class PriorityBandOut(BaseModel):
    label: str
    count: int
    pct: float


class PriorityLoadOut(BaseModel):
    active_total: int
    priorities: List[PriorityBandOut]
