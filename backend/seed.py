"""
seed.py — Pre-processes all tweets from tweets.json through the ML pipeline.
Run this once before starting the server to warm models and verify the pipeline.

Usage:
    python seed.py
"""

import json
from pathlib import Path
from pipeline.main import process_post, load_all_models

TWEETS_PATH = Path(__file__).parent / "ingestion" / "tweets.json"

def run():
    # Load models once
    load_all_models()

    # Load tweets
    if not TWEETS_PATH.exists():
        print("[seed] ERROR: tweets.json not found.")
        return

    tweets = json.loads(TWEETS_PATH.read_text())
    print(f"\n[seed] Processing {len(tweets)} tweets...\n")
    print("-" * 90)

    results = []
    for i, tweet in enumerate(tweets):
        try:
            result = process_post(tweet)
            results.append(result)
            print(
                f"[{i+1:02}] @{result['username']:<25} "
                f"| {result['category']:<15} "
                f"| {result['urgency']:<8} "
                f"| {result['department']:<15} "
                f"| loc: {result['location'] or 'N/A'}"
            )
        except Exception as e:
            print(f"[{i+1:02}] ERROR on tweet {tweet.get('id')}: {e}")

    print("-" * 90)
    print(f"\n[seed] Done. {len(results)}/{len(tweets)} tweets processed successfully.\n")

    # Summary stats
    from collections import Counter
    categories = Counter(r["category"] for r in results)
    urgencies  = Counter(r["urgency"]  for r in results)
    depts      = Counter(r["department"] for r in results)

    print("=== Category Breakdown ===")
    for k, v in categories.most_common():
        print(f"  {k:<20} {v}")

    print("\n=== Urgency Breakdown ===")
    for k, v in urgencies.most_common():
        print(f"  {k:<20} {v}")

    print("\n=== Department Routing ===")
    for k, v in depts.most_common():
        print(f"  {k:<20} {v}")

if __name__ == "__main__":
    run()