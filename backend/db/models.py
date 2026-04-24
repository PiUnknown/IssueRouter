from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from db.database import Base

def generate_ticket_id():
    return f"TKT-{uuid.uuid4().hex[:8].upper()}"

class Complaint(Base):
    __tablename__ = "complaints"

    id          = Column(String, primary_key=True, default=generate_ticket_id)
    tweet_id    = Column(String, unique=True)
    username    = Column(String)
    raw_text    = Column(String)
    clean_text  = Column(String)
    cluster_id  = Column(String, ForeignKey("clusters.id"))
    category    = Column(String)
    urgency     = Column(String)
    location    = Column(String)
    retweets    = Column(Integer, default=0)
    likes       = Column(Integer, default=0)
    timestamp   = Column(DateTime, default=datetime.utcnow)
"""
db/models.py — SQLAlchemy ORM models for IssueRouter.
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class Cluster(Base):
    __tablename__ = "clusters"

    id                 = Column(String, primary_key=True)
    problem            = Column(String)
    summary            = Column(String)
    location           = Column(String)
    category           = Column(String)
    department         = Column(String)
    complaint_count    = Column(Integer, default=0)
    rt_reach           = Column(Integer, default=0)
    urgency            = Column(String)
    priority_score     = Column(Float, default=0.0)
    recommended_action = Column(String)
    status             = Column(String, default="pending")
    centroid_embedding = Column(String)  # stored as JSON string
    last_updated       = Column(DateTime, default=datetime.utcnow)

    complaints = relationship("Complaint", backref="cluster")

class Action(Base):
    __tablename__ = "actions"

    id         = Column(String, primary_key=True, default=generate_ticket_id)
    cluster_id = Column(String, ForeignKey("clusters.id"))
    action     = Column(String)
    timestamp  = Column(DateTime, default=datetime.utcnow)
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
