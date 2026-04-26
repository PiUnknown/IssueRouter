"""
Pre-populates the database with demo clusters before a presentation.
Run this BEFORE starting the server for demo day.

Usage (PowerShell):
    cd backend
    .\\venv\\Scripts\\Activate.ps1
    python seed.py
"""

import json
import sys
from pathlib import Path
from datetime import datetime, timedelta
import random

# Make sure we can import backend modules
sys.path.insert(0, str(Path(__file__).parent))

from db.database import init_db, SessionLocal
from db.models import Cluster, Complaint
from pipeline.clusterer import get_embedding, embedding_to_blob
from pipeline.urgency import compute_priority_score

SEED_CLUSTERS = [
    {
        "problem":            "Contaminated water supply — Uttam Nagar",
        "summary":            "412 complaints of brown, foul-smelling water in Uttam Nagar Blocks A–D. Multiple gastroenteritis cases reported.",
        "location":           "Uttam Nagar, West Delhi",
        "category":           "Water Supply",
        "department":         "Jal Board",
        "urgency":            "critical",
        "complaint_count":    412,
        "rt_reach":           3840,
        "recommended_action": "Emergency water tanker deployment. Lab testing of supply line at Uttam Nagar pumping station.",
        "trend":              "up",
        "sample_tweets": [
            ("uttam_resident", "Water from tap is literally brown and smells like sewage. Kids got sick. #complaints_gov"),
            ("DelhiVoices", "414 complaints about Uttam Nagar water in one day and ZERO response from Jal Board."),
            ("priya_wahi", "Entire colony on block C same problem. 3 days now."),
        ]
    },
    {
        "problem":            "Severe pothole damage — Mayur Vihar Phase 1",
        "summary":            "287 complaints of severe potholes on Mayur Vihar main road. Vehicle damage and near-miss accidents reported.",
        "location":           "Mayur Vihar, East Delhi",
        "category":           "Infrastructure",
        "department":         "PWD",
        "urgency":            "high",
        "complaint_count":    287,
        "rt_reach":           2110,
        "recommended_action": "Emergency pothole patching team dispatched. PWD site inspection required by EOD.",
        "trend":              "up",
        "sample_tweets": [
            ("mayurvihar_news", "Quite frustrated with these roads. Have been tough few days. #complaints_gov"),
            ("RajeshMV", "My tyre burst today on Mayur Vihar main road. Something needs to change."),
            ("delhi_commuter", "Same 3 potholes unfixed for 2 months. Someone will die here."),
        ]
    },
    {
        "problem":            "Frequent power cuts — Rohini Sector 7",
        "summary":            "198 complaints of 8–12 hour daily outages in Rohini Sector 7. Hospital backup generators activated twice this week.",
        "location":           "Rohini, North Delhi",
        "category":           "Utilities",
        "department":         "BSES / Power",
        "urgency":            "high",
        "complaint_count":    198,
        "rt_reach":           1670,
        "recommended_action": "BSES to inspect Sector 7 substation transformer. Temporary DG set for hospital wing.",
        "trend":              "flat",
        "sample_tweets": [
            ("rohini_sec7", "No power for 10 hours straight. 4th time this week. #complaints_gov"),
            ("NiteshKumar_D", "Hospital in Sec 7 on backup. BSES fix the transformer NOW."),
            ("rohini_voices", "Fridge full of food spoiled. BSES helpline just rings."),
        ]
    },
    {
        "problem":            "Garbage accumulation — Dwarka Sector 10 market",
        "summary":            "143 complaints of overflowing bins near Dwarka Sector 10 market for 5+ days. Rodents and blocked footpath reported.",
        "location":           "Dwarka, South West Delhi",
        "category":           "Sanitation",
        "department":         "MCD",
        "urgency":            "medium",
        "complaint_count":    143,
        "rt_reach":           890,
        "recommended_action": "Emergency garbage collection van deployment. Review sanitation schedule for Dwarka Sector 10.",
        "trend":              "flat",
        "sample_tweets": [
            ("dwarka_matters", "Garbage bin near Sector 10 not cleared in 6 days. Rats visible. #complaints_gov"),
            ("sunita_dwarka", "Cannot walk on footpath. Garbage piled 4 feet. MCD sleeping?"),
            ("mkt_trader_10", "Business down 30% because customers avoid the smell."),
        ]
    },
    {
        "problem":            "Stray dog menace — Lajpat Nagar Colony",
        "summary":            "97 complaints of aggressive stray dog attacks near Lajpat Nagar park. 4 bite incidents in 72 hours.",
        "location":           "Lajpat Nagar, South Delhi",
        "category":           "Healthcare",
        "department":         "Health Department",
        "urgency":            "high",
        "complaint_count":    97,
        "rt_reach":           1240,
        "recommended_action": "Animal control team deployment. Bite victims to PHC for post-exposure prophylaxis.",
        "trend":              "up",
        "sample_tweets": [
            ("lajpat_colony", "3rd dog bite case this week. 7-year-old attacked. #complaints_gov"),
            ("safestreetsDL", "Nobody listening about stray dog pack near Lajpat park. Public safety emergency."),
            ("priyanka_LN", "4 bites reported, zero action. Please escalate."),
        ]
    },
    {
        "problem":            "Broken streetlights — Akbar Road stretch",
        "summary":            "63 complaints of 14 non-functional streetlights on 1.2km Akbar Road stretch. Safety concerns after 9pm.",
        "location":           "Akbar Road, Central Delhi",
        "category":           "Infrastructure",
        "department":         "PWD",
        "urgency":            "low",
        "complaint_count":    63,
        "rt_reach":           410,
        "recommended_action": "PWD electrical maintenance to inspect and replace faulty fixtures. Night patrol requested.",
        "trend":              "flat",
        "sample_tweets": [
            ("akbar_rd_watch", "Akbar Road totally dark after 9pm. Robbery near Janpath last night. #complaints_gov"),
            ("central_delhi", "Complained 11 days ago. Still 14 poles dark. Nothing done."),
            ("safewalkDelhi", "Women especially unsafe on this stretch."),
        ]
    },
]


def seed():
    print("[seed] Initialising DB...")
    init_db()
    db = SessionLocal()

    # Clear existing data for clean demo
    db.query(Complaint).delete()
    db.query(Cluster).delete()
    db.commit()
    print("[seed] Cleared existing data.")

    for i, data in enumerate(SEED_CLUSTERS, start=1):
        # Create cluster
        centroid_text = data["sample_tweets"][0][1]
        cluster = Cluster(
            problem            = data["problem"],
            summary            = data["summary"],
            location           = data["location"],
            category           = data["category"],
            department         = data["department"],
            urgency            = data["urgency"],
            complaint_count    = data["complaint_count"],
            rt_reach           = data["rt_reach"],
            recommended_action = data["recommended_action"],
            trend              = data["trend"],
            centroid_embedding = embedding_to_blob(get_embedding(centroid_text)),
            priority_score     = compute_priority_score(
                data["complaint_count"], data["rt_reach"], data["urgency"]
            ),
            priority_rank      = i,
            last_updated       = datetime.utcnow() - timedelta(minutes=random.randint(5, 120)),
        )
        db.add(cluster)
        db.flush()

        # Add sample complaints
        for j, (username, text) in enumerate(data["sample_tweets"]):
            complaint = Complaint(
                tweet_id   = f"seed_{i}_{j}",
                username   = username,
                raw_text   = text,
                clean_text = text,
                category   = data["category"],
                urgency    = data["urgency"],
                location   = data["location"],
                department = data["department"],
                retweets   = random.randint(5, 150),
                likes      = random.randint(2, 80),
                cluster_id = cluster.id,
                timestamp  = datetime.utcnow() - timedelta(hours=random.randint(1, 12)),
            )
            db.add(complaint)

        print(f"[seed] ✓ Cluster {i}: {data['problem']}")

    db.commit()
    db.close()
    print(f"\n[seed] Done. {len(SEED_CLUSTERS)} clusters seeded. Run the server now.")


if __name__ == "__main__":
    seed()