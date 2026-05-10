import time
from db.database import SessionLocal
from db.models import RawTweet

def stream_from_db(callback, interval_seconds: int = 8):
    """
    Reads unprocessed tweets from raw_tweets table.
    Calls callback with each tweet dict.
    Marks tweet as processed after callback succeeds.
    Loops continuously — sleeps when no unprocessed tweets remain.
    """
    print("[db_feed] Starting DB feed. Reading unprocessed tweets...")

    while True:
        db = SessionLocal()

        tweet = db.query(RawTweet).filter(
            RawTweet.processed == False
        ).order_by(RawTweet.inserted_at).first()

        if tweet is None:
            print("[db_feed] No unprocessed tweets. Waiting...")
            db.close()
            time.sleep(interval_seconds)
            continue

        tweet_dict = {
            "id":         tweet.id,
            "username":   tweet.username,
            "text":       tweet.text,
            "likes":      tweet.likes,
            "retweets":   tweet.retweets,
            "created_at": tweet.created_at,
        }

        try:
            callback(tweet_dict)
            # Mark as processed only if callback succeeded
            tweet.processed = True
            db.commit()
            print(f"[db_feed] ✓ Processed and marked: @{tweet.username}")
        except Exception as e:
            print(f"[db_feed] Error processing tweet: {e}")
            db.rollback()
        finally:
            db.close()

        time.sleep(interval_seconds)