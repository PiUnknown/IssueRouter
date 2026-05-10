from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from db.database import Base

def generate_ticket_id():
    return f"TKT-{uuid.uuid4().hex[:8].upper()}"

class RawTweet(Base):
    __tablename__ = "raw_tweets"

    id           = Column(String, primary_key=True)
    username     = Column(String)
    text         = Column(String)
    likes        = Column(Integer, default=0)
    retweets     = Column(Integer, default=0)
    created_at   = Column(String)
    processed    = Column(Boolean, default=False)  # ← key field
    inserted_at  = Column(DateTime, default=datetime.utcnow)

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
    centroid_embedding = Column(String)
    last_updated       = Column(DateTime, default=datetime.utcnow)

    complaints = relationship("Complaint", backref="cluster")

class Action(Base):
    __tablename__ = "actions"

    id         = Column(String, primary_key=True, default=generate_ticket_id)
    cluster_id = Column(String, ForeignKey("clusters.id"))
    action     = Column(String)
    timestamp  = Column(DateTime, default=datetime.utcnow)