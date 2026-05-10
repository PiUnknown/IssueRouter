"""
Run this ONCE before starting the server.
Loads tweets.json into raw_tweets table in SQLite.
"""
import json
from pathlib import Path
from db.database import engine, Base, SessionLocal
from db.models import RawTweet

def seed():
    # Create all tables
    Base.metadata.create_all(bind=engine)

    tweets_path = Path(__file__).parent / "ingestion" / "tweets.json"
    tweets = json.loads(tweets_path.read_text())

    db = SessionLocal()
    inserted = 0
    skipped = 0

    for tweet in tweets:
        # Check if already exists
        existing = db.query(RawTweet).filter(
            RawTweet.id == str(tweet["id"])
        ).first()

        if existing:
            skipped += 1
            continue

        raw = RawTweet(
            id         = str(tweet["id"]),
            username   = tweet.get("username", "unknown"),
            text       = tweet.get("text", ""),
            likes      = tweet.get("likes", 0),
            retweets   = tweet.get("retweets", 0),
            created_at = tweet.get("created_at", ""),
            processed  = False
        )
        db.add(raw)
        inserted += 1

    db.commit()
    db.close()

    print(f"[seed] Done. {inserted} tweets inserted, {skipped} already existed.")

if __name__ == "__main__":
    seed()