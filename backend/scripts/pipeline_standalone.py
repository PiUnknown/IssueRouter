"""
pipeline_standalone.py — Standalone pipeline processor (no DB dependency)
Input:  tweets.json
Output: processed_results.json
"""
import json
import sys
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from pipeline.main import load_all_models, process_post
from ingestion.mock_feed import load_tweets

def process_all_tweets():
    """Load tweets from tweets.json and process them through the pipeline."""
    
    print("\n" + "="*80)
    print("  ISSUEBROUTER — PIPELINE STANDALONE")
    print("="*80 + "\n")
    
    # Step 1: Load models
    print("[1/3] Loading ML models...")
    load_all_models()
    print("      ✓ Models loaded.\n")
    
    # Step 2: Load tweets
    print("[2/3] Loading tweets...")
    try:
        tweets = load_tweets()
        print(f"      ✓ Loaded {len(tweets)} tweets.\n")
    except FileNotFoundError as e:
        print(f"      ✗ Error: {e}")
        return
    
    # Step 3: Process each tweet
    print("[3/3] Processing tweets through NLP pipeline...\n")
    print("-" * 80)
    
    results = []
    for i, tweet in enumerate(tweets, 1):
        try:
            result = process_post(tweet)
            results.append(result)
            
            # Pretty print each result
            print(f"\n[{i:2d}] @{result['username']}")
            print(f"     Raw:      {tweet['text'][:70]}...")
            print(f"     Clean:    {result['clean_text'][:70]}...")
            print(f"     Category: {result['category']} ({result['confidence']})")
            print(f"     Location: {result['location'] or '(not detected)'}")
            print(f"     Department: {result['department']}")
            print(f"     Urgency:  {result['urgency']} (weight: {result['urgency_weight']})")
            print(f"     Retweets: {result['retweets']} | Likes: {result['likes']}")
            
        except Exception as e:
            print(f"\n[{i:2d}] Error processing tweet: {e}")
            continue
    
    print("\n" + "-" * 80)
    print(f"\n✓ Successfully processed {len(results)}/{len(tweets)} tweets.\n")
    
    # Step 4: Save results
    output_path = Path(__file__).parent / "output" / "processed_results.json"
    output_path.parent.mkdir(exist_ok=True)
    
    output_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "total_processed": len(results),
        "results": results
    }
    
    output_path.write_text(json.dumps(output_data, indent=2))
    print(f"✓ Results saved to: {output_path}\n")
    
    # Step 5: Summary statistics
    print("="*80)
    print("SUMMARY STATISTICS")
    print("="*80)
    
    from collections import Counter
    
    categories = Counter(r['category'] for r in results)
    urgencies = Counter(r['urgency'] for r in results)
    departments = Counter(r['department'] for r in results)
    
    print("\n📊 By Category:")
    for cat, count in categories.most_common():
        print(f"   {cat:<20} {count:3d}")
    
    print("\n🚨 By Urgency:")
    for urg, count in urgencies.most_common():
        print(f"   {urg:<20} {count:3d}")
    
    print("\n🏢 By Department:")
    for dept, count in departments.most_common():
        print(f"   {dept:<20} {count:3d}")
    
    print("\n📍 Top Locations:")
    locations = Counter(r['location'] for r in results if r['location'])
    for loc, count in locations.most_common(10):
        print(f"   {loc:<30} {count:3d}")
    
    print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    process_all_tweets()