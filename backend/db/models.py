"""
db/models.py — SQLAlchemy ORM models for IssueRouter.
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class Cluster(Base):
    __tablename__ = "clusters"

    cluster_id      = Column(String, primary_key=True, index=True)
    priority        = Column(Integer, nullable=False)           # 1 = critical → 4 = low
    problem         = Column(String, nullable=False)
    summary         = Column(Text, nullable=False)
    location        = Column(String, nullable=False)
    lat             = Column(Float, nullable=True)              # for heatmap / map pins
    lng             = Column(Float, nullable=True)
    department      = Column(String, nullable=False)
    complaint_count = Column(Integer, default=0)
    rt_reach        = Column(Integer, default=0)
    trend           = Column(String, default="stable")          # up | down | stable
    recommended_action = Column(Text, nullable=True)
    time_window     = Column(String, default="Last 24 hours")
    status          = Column(String, default="pending")         # pending | inprogress | resolved
    created_at      = Column(DateTime, default=datetime.utcnow)

    tweets = relationship("Tweet", back_populates="cluster", cascade="all, delete-orphan")


class Tweet(Base):
    __tablename__ = "tweets"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    cluster_id = Column(String, ForeignKey("clusters.cluster_id"), nullable=False)
    handle     = Column(String, nullable=False)
    text       = Column(Text, nullable=False)

    cluster = relationship("Cluster", back_populates="tweets")
