# X-Based AI Grievance Triage Assistant MVP Plan

---

## 1. Problem Framing (Sharp, Non-Generic)

**The Problem:**
Government departments, city administrations, and public institutions are drowning in unstructured complaints. Citizens submit grievances via email, calls, WhatsApp, social media—each with different formats, unclear locations, vague urgency, and no automatic routing. A public works department receives "potholes near the market" but doesn't know which market, doesn't know if it's critical or minor, and has no automated way to assign it. **The pain is not solving issues; it's sorting them.**

**Who Feels It:**
- City administrators: Complaints land everywhere—no single source of truth
- Citizens: No visibility into complaint status or which department owns their issue
- Public workers: They receive poorly categorized tasks with missing context

**Why Current Systems Fail:**
- Manual data entry is slow and error-prone
- Complaints lack structured metadata (location, urgency, category)
- No intelligent routing—a road complaint goes to someone's inbox, not to PWD
- No prioritization—critical safety issues get buried next to cosmetic complaints

**Why AI/ML is Necessary (Not Optional):**
- **Text classification** extracts structured category from free-form text
- **Named Entity Recognition** pulls location and department names automatically
- **Urgency detection** identifies safety-critical complaints without manual review
- **Semantic clustering** groups duplicate/related complaints into single actionable clusters
- **Summarization** standardizes messy citizen language into actionable summaries
- This 5-step pipeline cannot be solved with rules alone—it requires ML

---

## 2. MVP Scope (Hackathon-Optimized)

**What IS Built (Scope):**
1. ✅ Real-time X post ingestion via Tweepy FilteredStream (search for `#complaints_gov`); mock replay for dev/demo
2. ✅ ML pipeline:
   - Zero-shot text classification (6 categories: Infrastructure, Water, Sanitation, Health, Safety, Other) via BART
   - NER for location extraction — spaCy + Indian locality gazetteer
   - Urgency scoring (Low/Medium/High) — hybrid keyword rules + retweet-boost
   - Semantic clustering — sentence-transformers groups similar complaints
   - LLM-based summary generation — Groq API (free tier)
3. ✅ SQLite database storing complaints with metadata
4. ✅ React admin dashboard — dark-themed, priority-ranked cluster cards with expand panels
5. ✅ Department routing suggestion (deterministic rule-based: category → department)
6. ✅ Officer actions: Assign / Resolve / Escalate / Export Brief

**What is EXCLUDED (Out of Scope):**
- ❌ Closed-loop feedback (citizens don't see status updates in this MVP)
- ❌ Multi-language support
- ❌ Real email routing to departments (show suggestions only)
- ❌ User authentication (public dashboard)
- ❌ Fine-tuned models (zero-shot + pre-trained only)
- ❌ Mobile app

**The "Wow Factor" Demo Moment:**
Show judges a real X post like *"Broken streetlight on Main St, happens every night, nobody fixes it!"*
→ System instantly outputs:
- **Category:** Infrastructure | **Urgency:** High | **Department:** PWD | **Location:** Main St
- Clean summary shown in dashboard
- Original X post linked
- Cluster card shows if other similar complaints were grouped together
Repeat with 2–3 more examples in 60 seconds. Judges see: "This could save hours of work per day."

---

## 3. End-to-End User Flow

### User Side (Citizen):
```
1. Citizen posts on X: "Potholes blocking traffic, Area 51, near mosque. Fix ASAP!"
2. Citizen adds hashtag: #complaints_gov
3. Post goes live (no special action needed)
```

### System Processing:
```
4. Tweepy FilteredStream: ingests #complaints_gov posts live
5. For each new post:
   a. Extract text, author, timestamp, retweet count
   b. Run through ML pipeline:
      - BART zero-shot classification → "Infrastructure"
      - spaCy + EntityRuler NER → Extract "Area 51"
      - Urgency scorer → "High" (keywords: "ASAP", "blocking", "traffic")
      - sentence-transformers → cluster with similar pothole complaints
      - Groq LLM → "Dangerous pothole on main road, Area 51 — immediate action needed"
   c. Urgency rank boosted if retweet_count > threshold
   d. Rule-based routing → "Public Works Department"
   e. Store in DB; dashboard cluster card updated
6. Dashboard auto-refreshes (polling or WebSocket)
```

### Admin Side (Government):
```
7. Dashboard loads → See priority-ranked cluster cards (not a raw tweet feed)
8. Click any cluster card → See:
   - Grouped complaints (volume × social reach = rank)
   - Extracted metadata (category, urgency, location, dept)
   - AI-generated one-line officer brief
   - Original X post links
9. Officer actions:
   - Assign / Resolve / Escalate / Export Brief
   - Filter by urgency/category
```

---

## 4. System Architecture (Practical, Not Theoretical)

```
┌─────────────────────────────────────────────────────────────┐
│                    X PUBLIC API                              │
│    Tweepy FilteredStream (#complaints_gov) / mock replay    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI + Python)                      │
│                                                              │
│  1. Ingestion Layer                                          │
│     └─ Tweepy FilteredStream → raw post → DB                │
│                                                              │
│  2. ML Pipeline (Dev 2 — pipeline/ai-migration-fixes)        │
│     ├─ Classification: BART zero-shot (bart-large-mnli)     │
│     ├─ NER: spaCy en_core_web_sm + EntityRuler gazetteer    │
│     ├─ Urgency: Hybrid keyword rules + retweet-boost        │
│     ├─ Clustering: sentence-transformers all-MiniLM-L6-v2   │
│     └─ Summarisation: Groq API (llama3-8b-8192)             │
│                                                              │
│  3. Routing Logic (Deterministic Rules)                      │
│     └─ category → department mapping                         │
│                                                              │
│  4. REST API Endpoints                                       │
│     ├─ GET /api/complaints (all, filtered)                  │
│     ├─ GET /api/complaints/:id (detail)                     │
│     ├─ POST /api/complaints/:id/status (mark processed)     │
│     └─ GET /api/stats (dashboard metrics)                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  SQLite Database     │
        │                      │
        │ Table: complaints    │
        │ - id                 │
        │ - x_post_id          │
        │ - text               │
        │ - category           │
        │ - location           │
        │ - urgency            │
        │ - retweet_count      │
        │ - cluster_id         │
        │ - department         │
        │ - summary            │
        │ - confidence_score   │
        │ - priority_rank      │
        │ - created_at         │
        └──────────────────────┘
                   ▲
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   ┌─────────────┐   ┌──────────────────┐
   │  React SPA  │   │  WebSocket Feed  │
   │ (Dashboard) │   │  (Live updates)  │
   │ Dark theme  │   │                  │
   │ Cluster     │   │                  │
   │ Cards +     │   │                  │
   │ Expand Panel│   │                  │
   └─────────────┘   └──────────────────┘
```

**Key Flows:**
1. **Ingestion:** Tweepy FilteredStream → FastAPI → Store raw post in DB
2. **Processing:** Background pipeline runs BART → spaCy → urgency → cluster → Groq → update DB
3. **Display:** React fetches from API → Dashboard renders ranked cluster cards
4. **Live Updates:** WebSocket/polling pushes new clusters to open dashboards

---

## 5. AI/ML Design (Confirmed Stack)

### A. Text Classification (Category Assignment)

**Problem:** Classify "Potholes on Main Street" → Infrastructure

**Model Choice (confirmed):**
- **Model:** `facebook/bart-large-mnli` via Hugging Face zero-shot pipeline
- **Why:** No training data required, strong out-of-the-box accuracy for civic complaint categories, CPU-friendly for demo

**Implementation:**
```python
from transformers import pipeline

classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

candidate_labels = ["Infrastructure", "Water", "Sanitation", "Health", "Safety", "Other"]

result = classifier(complaint_text, candidate_labels)
category = result["labels"][0]          # top prediction
confidence = result["scores"][0]        # confidence score
```

**Confidence Threshold:** Only show category if confidence > 0.6; otherwise flag as "Unclear / Manual Review"
One-line pitch: Turns the noise of citizen complaints on X into a ranked, department-routed action list for government officers — automatically, in real time. Stack: Python · FastAPI · React · spaCy · HuggingFace · Claude API · SQLite Team: 2–4 developers · Timeline: 24–48 hours

1. Problem Framing
The exact problem
Government departments receive thousands of unstructured citizen complaints daily on X (Twitter). A pothole complaint reaches the health department. A water contamination issue sits in a general inbox. An urgent gas leak gets the same queue priority as a broken park bench. The bottleneck is not resolution — it is sorting.

Who experiences it and why current systems fail
Citizens: post complaints publicly but get no acknowledgment, no routing confirmation, no follow-up. The complaint disappears.
Government staff: spend 40–60% of triage time manually reading, categorising, and forwarding posts. Interns monitor hashtags intermittently. Nothing is systematic.
Officers/DMs: have no single view of what citizens are complaining about most, which areas are hotspots, or which departments are being overwhelmed.
Current systems fail because:

No existing civic portal pulls from X automatically
Manual monitoring is inconsistent and unscalable
Keyword-based filtering cannot understand context ("bridge near school" → infrastructure? safety?)
No clustering — 300 tweets about the same pothole appear as 300 separate items
No urgency ranking — a gas leak and a faded road marking look identical in a raw feed
Why AI/ML is necessary (not optional)
Free-text complaints are structurally unpredictable. Rules break on every new phrasing variant.
NER is the only reliable way to extract locations from phrases like "near the old cinema on MG Road."
Multi-label classification handles complaints spanning departments ("sewage flooding the park" → Sanitation + Parks).
Semantic clustering groups 300 pothole tweets into one actionable report — impossible without embeddings.
LLM summarisation compresses clusters into one-line officer briefs that rules cannot generate.
Social signal weighting (retweet-boosted urgency) requires understanding context, not just counting.
2. MVP Scope
What will be built in 24–48 hours
Ingestion layer:

Mock tweet replayer that streams pre-collected #complaints_gov posts into the backend on an 8-second interval (API-identical to tweepy so real API is a one-function swap)
Post normaliser: strips hashtags, handles, URLs; passes clean text downstream
NLP pipeline:

Zero-shot text classification → category
spaCy NER → location, facility, organisation entities
Hybrid urgency scorer → keyword rules + retweet-count boost
Claude Haiku summarisation → one-line officer brief
Semantic clustering → groups similar location+category posts into one cluster record
Admin dashboard:

Priority-ranked cluster cards (#1, #2, #3...) sorted by complaint volume × social reach
Each card: priority badge, problem title, location, department badge, complaint count, RT reach, AI summary, recommended action
Expand panel: sample tweets, SLA window, action buttons (Assign / Resolve / Escalate / Export)
Sidebar: filter by department and location
Live "last ingested" counter that ticks every 8 seconds during demo
Explicitly excluded
Citizen-facing UI (citizens only interact via X — no app needed)
Real Twitter API access (mock replay is sufficient for demo)
Authentication / role-based access control
Email/SMS notification to actual departments
Multi-language NLP (Hinglish is handled at classification level, not full translation)
Mobile-responsive design
The "wow factor" demo moment
The dashboard is open with 20 pre-seeded cluster cards. The mock feed is running. Every 8 seconds a new tweet processes and the counter ticks. A judge asks: "Can you show it handling something urgent?" You trigger the gas leak tweet manually. Within 2 seconds a new #1 PRIORITY card appears at the top of the list — red stripe, Jal Board badge, 203 RT reach flagged — bumping everything else down. The room sees the entire chain: raw messy tweet in → structured actionable brief out, ranked above everything else automatically.

3. End-to-End User Flow
Citizen side (zero friction)
Citizen sees a pothole, types: "bhai Mayur Vihar ki sadak toot gayi hai, car damage ho rahi hai #complaints_gov"
Posts it on X. Done. No app, no form, no registration.
System processing (fully automated)
Mock feed replayer picks up the post (8s poll interval).
Normaliser strips hashtag, emoji, URLs → clean text: "bhai Mayur Vihar ki sadak toot gayi hai, car damage ho rahi hai"
Classifier (BART zero-shot) → Infrastructure / Road Maintenance, confidence 0.87
NER (spaCy + custom ruler) → GPE: Mayur Vihar, PROBLEM: sadak/road
Urgency scorer → keywords: "damage" → Medium; RT count < 50 → stays Medium
Cluster matcher → cosine similarity to existing clusters → matches existing Mayur Vihar road cluster (similarity 0.89) → added to that cluster, count bumps from 286 → 287
Summariser (Claude Haiku) → cluster summary regenerated: "Severe pothole damage on main road, Mayur Vihar. 287 complaints. Vehicle damage reported."
DB write → complaint record saved, cluster record updated
Dashboard refreshes (5s poll) → cluster card count updates to 287, social reach recalculated
Officer/dashboard side
Officer opens /dashboard — sees ranked cluster cards sorted by priority score.
Filters by "PWD" department — sees only road/infrastructure clusters.
Clicks Mayur Vihar card → expand panel opens → recommended action displayed, sample tweets visible.
Clicks "Assign to Department" → status changes to "Assigned", card moves to "In Progress" column.
At end of day: "Export Brief" generates a one-page summary PDF for the DM's review.
4. System Architecture
[X / Mock Feed]
      |
      | hashtag posts (JSON)
      v
[Ingestion Service]  ← background thread, 8s interval
      |
      | clean Post object
      v
[NLP Pipeline]  ← runs in-process, no microservices
      |── Classifier     (BART zero-shot)
      |── NER            (spaCy en_core_web_sm + EntityRuler)
      |── Urgency Scorer (rules + RT boost)
      |── Summariser     (Claude Haiku API)
      |── Cluster Matcher (sentence-transformers cosine similarity)
      |
      | structured ClusterUpdate object
      v
[FastAPI Backend]
      |── POST /ingest          (internal, called by ingestion service)
      |── GET  /clusters        (paginated, filterable)
      |── GET  /clusters/{id}   (cluster detail + sample tweets)
      |── PUT  /clusters/{id}/status  (assign / resolve / escalate)
      |── GET  /stats           (counts by dept, urgency, trend)
      |
[SQLite via SQLAlchemy]
      |── complaints table  (raw tweets + NLP output)
      |── clusters table    (aggregated issue groups)
      |── actions table     (officer actions log)
      |
[React Dashboard]  ← polls GET /clusters every 5s
      |── Cluster card list (priority sorted)
      |── Expand panel
      |── Sidebar filters
      |── Stats bar
Component communication
Ingestion → Pipeline → DB: synchronous Python function calls in one process. No queues, no microservices. FastAPI runs ingestion as a background thread at startup.
Backend → Frontend: REST/JSON. Dashboard polls every 5s. No WebSockets needed for hackathon.
Pipeline → Claude API: single HTTP call per cluster update. Cached per cluster — only recalculated when complaint count crosses thresholds (10, 50, 100, 250).
5. AI/ML Design
A. Text Classification
Goal: Assign category — Infrastructure, Sanitation, Healthcare, Utilities, Education, Law & Order, Environment.

Model: facebook/bart-large-mnli via HuggingFace pipeline("zero-shot-classification")

Why: Zero training data required. Pass candidate labels directly. ~80–85% accuracy on civic complaints out of the box. Explainable to judges in one sentence.

Fallback: If latency is a problem (BART is ~400ms), generate 500 synthetic labelled examples with GPT-4 and fine-tune distilbert-base-uncased in ~2 hours. Drops to ~60ms inference.

from transformers import pipeline
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
labels = ["Infrastructure", "Healthcare", "Sanitation", "Education", "Utilities", "Law & Order"]
result = classifier(clean_text, candidate_labels=labels)
category = result["labels"][0]
Tradeoff: Zero-shot = no data, slower. Fine-tuned = fast, needs data (use GPT-4 to generate it — 10 minutes).

B. Named Entity Recognition
Goal: Extract LOCATION, FACILITY, ORGANIZATION, DATE from complaint text.

Model: spaCy en_core_web_sm (12MB, <10ms inference) + custom EntityRuler

Why: Fast, reliable on place names, trivially extensible. Custom ruler adds Indian cities, PIN codes, department abbreviations, local landmarks.

import spacy
nlp = spacy.load("en_core_web_sm")
ruler = nlp.add_pipe("entity_ruler", before="ner")
ruler.add_patterns([
    {"label": "GPE",        "pattern": "Mayur Vihar"},
    {"label": "GPE",        "pattern": "Uttam Nagar"},
    {"label": "DEPARTMENT", "pattern": "PWD"},
    {"label": "DEPARTMENT", "pattern": "NDMC"},
    {"label": "DEPARTMENT", "pattern": "Jal Board"},
])
doc = nlp(clean_text)
location = next((e.text for e in doc.ents if e.label_ in ["GPE","LOC"]), None)
Enhancement: Maintain a 200-entry gazetteer of Delhi/Mumbai/Bangalore localities as a Python dict. Simple substring match runs before spaCy. Covers 90% of demo inputs.

Tradeoff: en_core_web_sm struggles with transliterated Hindi. Acceptable for hackathon. For production: xx_ent_wiki_sm or Google Cloud NL API.

**Problem:** Extract "Main Street" or "Sector 5" from "Potholes on Main Street near mosque" — including informal Indian locality names

**Model Choice (confirmed):**
- **Library:** spaCy `en_core_web_sm` + custom `EntityRuler` with an Indian locality gazetteer
- **Why:** Fast, zero GPU, custom gazetteer handles informal place names that generic NER misses (e.g., "Gurugram", "Sector 56", landmark names)

**Implementation:**
```python
import spacy
from spacy.pipeline import EntityRuler

nlp = spacy.load("en_core_web_sm")

# Custom gazetteer for Indian localities
ruler = nlp.add_pipe("entity_ruler", before="ner")
patterns = [
    {"label": "GPE", "pattern": "Gurugram"},
    {"label": "GPE", "pattern": "Sector 56"},
    {"label": "LOC", "pattern": "near the mosque"},
    # ... extend with local landmark patterns
]
ruler.add_patterns(patterns)

doc = nlp("Potholes near the mosque in Sector 56")
locations = [ent.text for ent in doc.ents if ent.label_ in ("GPE", "LOC")]
# Output: ["the mosque", "Sector 56"]
```

**Fallback:** Regex for numbered sectors (`Sector \d+`) and street patterns (`\d+ .*?(Street|Road|Marg)`)

---

### C. Urgency Scoring (Hybrid: Rules + Retweet Boost)

**Problem:** Classify urgency and amplify based on social reach

**Approach (confirmed): Hybrid keyword rules + retweet-count boost**

```python
HIGH_KEYWORDS = {"fatal", "death", "injury", "emergency", "asap", "danger", "critical",
                 "blocked", "flooding", "accident", "immediate", "please fix", "no water"}
MEDIUM_KEYWORDS = {"broken", "issue", "problem", "not working", "needed", "days"}

RETWEET_BOOST_THRESHOLD = 50   # retweets above this → bump urgency one level

def compute_urgency(text: str, retweet_count: int) -> str:
    text_lower = text.lower()
    if any(kw in text_lower for kw in HIGH_KEYWORDS):
        base = "High"
    elif any(kw in text_lower for kw in MEDIUM_KEYWORDS):
        base = "Medium"
    else:
        base = "Low"

    # Retweet boost: social signal amplifies priority
    if retweet_count >= RETWEET_BOOST_THRESHOLD:
        if base == "Low":
            base = "Medium"
        elif base == "Medium":
            base = "High"

    return base
```

**Priority Rank Formula:**
```python
priority_score = complaint_volume_in_cluster * (1 + log(1 + total_retweets))
```
Cluster cards sorted descending by priority_score → officers always see highest-impact issues first.
C. Summarisation
Goal: Convert raw cluster of N tweets → one-line officer brief suitable for government action.

Primary: Claude Haiku (claude-haiku-4-5) via Anthropic SDK.

Why: Quality gap vs BART-CNN is substantial on civic text. Controllable format. ~300ms latency. Key: only called per cluster update, not per tweet — so API cost stays trivial.

Prompt:

You are a civic grievance analyst briefing a District Magistrate.
Given the following citizen complaint cluster, write ONE sentence (max 25 words)
for an officer: factual, location-specific, actionable.

Cluster summary: {aggregated_text}
Total complaints: {count}
Location: {location}
Category: {category}

### D. Semantic Clustering

**Problem:** Group "Pothole on MG Road" and "Bad road near MG Road market" into one cluster rather than surfacing as separate complaints

**Model Choice (confirmed):** `sentence-transformers/all-MiniLM-L6-v2`

```python
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")

def cluster_complaints(texts: list[str], threshold: float = 0.75) -> list[int]:
    embeddings = model.encode(texts)
    sim_matrix = cosine_similarity(embeddings)
    # Simple greedy clustering: assign to existing cluster if sim > threshold
    clusters = [-1] * len(texts)
    cluster_id = 0
    for i in range(len(texts)):
        if clusters[i] == -1:
            clusters[i] = cluster_id
            for j in range(i + 1, len(texts)):
                if sim_matrix[i][j] >= threshold:
                    clusters[j] = cluster_id
            cluster_id += 1
    return clusters
```

---

### E. Summarisation (LLM — Groq API)

**Model Choice (confirmed):** Groq API, `llama3-8b-8192` — free tier, no credit card required

```python
from groq import Groq

client = Groq()  # reads GROQ_API_KEY from env

def summarise_cluster(complaints: list[str]) -> str:
    combined = "\n".join(f"- {c}" for c in complaints)
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a government intake clerk. Given a cluster of citizen complaints, "
                    "write a single clear sentence for a government officer. "
                    "Include: issue type, location (if available), severity, and recommended action. "
                    "Be direct and professional. No preamble."
                )
            },
            {"role": "user", "content": combined}
        ],
        max_tokens=120
    )
    return response.choices[0].message.content.strip()
```
Output only the brief sentence. No preamble.
Fallback (offline): facebook/bart-large-cnn summarisation pipeline. Lower quality but works without internet. Pre-generate summaries for all demo clusters.

Tradeoff: Claude API requires internet. Always pre-cache summaries for demo clusters as a safety net.

D. Urgency Detection
Approach: Hybrid — keyword rules + social signal boost. No ML model needed.

URGENCY_KEYWORDS = {
    "critical": ["fire", "gas leak", "collapse", "flooding", "accident", "emergency",
                 "electric shock", "sewage overflow", "explosion", "casualty"],
    "high":     ["pothole", "broken", "damaged", "water cut", "power cut", "stray dog",
                 "bite", "garbage overflow", "road damage"],
    "medium":   ["maintenance", "leaking", "noise", "request", "missing", "dirty"],
    "low":      ["suggestion", "painting", "trimming", "minor"]
}

def score_urgency(text: str, retweets: int = 0) -> str:
    text_lower = text.lower()
    for level in ["critical", "high", "medium", "low"]:
        if any(kw in text_lower for kw in URGENCY_KEYWORDS[level]):
            base = level
            break
    else:
        base = "medium"

    # Social signal boost: viral = public urgency
    if retweets > 100 and base == "medium":
        base = "high"
    if retweets > 500 and base == "high":
        base = "critical"
    return base
Priority score formula (for ranking):

priority_score = complaint_count × 1.0 + (rt_reach × 0.3) + urgency_weight
urgency_weight: critical=200, high=100, medium=40, low=10
E. Semantic Clustering
Goal: Group tweets about the same issue (same location + same problem) into one cluster record.

Model: sentence-transformers/all-MiniLM-L6-v2 (80MB, ~20ms per embedding)

Implementation:

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("all-MiniLM-L6-v2")

def find_or_create_cluster(new_tweet: dict, existing_clusters: list) -> str:
    new_emb = model.encode(new_tweet["clean_text"])
    for cluster in existing_clusters:
        if cluster["category"] != new_tweet["category"]:
            continue  # only compare same category
        sim = cosine_similarity([new_emb], [cluster["centroid_embedding"]])[0][0]
        if sim > 0.82:
            return cluster["id"]  # add to existing cluster
    return create_new_cluster(new_tweet)  # new issue
Why 0.82 threshold: Lower → over-merges unrelated complaints. Higher → every tweet becomes its own cluster. 0.82 tested well on civic complaint text.

6. Data Strategy
What data is needed
50–80 pre-collected #complaints_gov tweets (seed file)
Indian city/locality gazetteer (~200 entries)
Department–category routing map (handcrafted, 30 minutes)
500 labelled examples if fine-tuning distilbert (optional)
How to mock quickly
Option A (best): GPT-4 prompt to generate synthetic tweets:

Generate 30 realistic Indian citizen complaints tagged #complaints_gov.
Mix Hindi-English (Hinglish). Cover: road damage, water supply, garbage,
power cuts, stray dogs. Include location names from Delhi/Mumbai/Bangalore.
Vary urgency. Output as JSON array: [{username, text, likes, retweets, created_at}]
Option B: Scrape r/india, r/delhi on Reddit for civic complaints. Filter by keywords. Free, no auth.

Dataset structure (tweets.json)
[
  {
    "id": "1749283746182",
    "username": "delhi_resident_42",
    "text": "Massive pothole on Akbar Road near CP has destroyed my tyres TWICE this month. #complaints_gov #Delhi",
    "created_at": "2024-01-15T09:23:00Z",
    "likes": 14,
    "retweets": 6
  }
]
Cluster record structure (DB)
{
  "cluster_id": "CLU-0047",
  "priority_score": 312.1,
  "priority_rank": 2,
  "problem": "Severe pothole damage — Mayur Vihar Phase 1",
  "summary": "287 complaints of pothole damage on Mayur Vihar main road causing vehicle damage.",
  "location": "Mayur Vihar, East Delhi",
  "category": "Infrastructure",
  "department": "PWD",
  "complaint_count": 287,
  "rt_reach": 2110,
  "urgency": "high",
  "trend": "up",
  "recommended_action": "Emergency pothole patching. PWD site inspection by EOD.",
  "time_window": "Last 24 hours",
  "status": "pending",
  "sample_tweet_ids": ["1749283746182", "1749283746199"],
  "centroid_embedding": [...],
  "last_updated": "2024-01-15T11:00:00Z"
}
7. Tech Stack
Frontend
React 18 via Vite (npm create vite@latest)
Tailwind CSS — utility-first, fast dashboard layout
shadcn/ui — pre-built table, badge, dialog components
Recharts — bar chart (by category), pie (urgency distribution)
axios — HTTP polling every 5s
Backend
Python 3.11+
FastAPI — async, auto-generates /docs for testing during build
Pydantic v2 — request/response schema validation
APScheduler — background ingestion job
uvicorn — ASGI server
ML Stack
spaCy en_core_web_sm — NER
HuggingFace Transformers facebook/bart-large-mnli — zero-shot classification
sentence-transformers all-MiniLM-L6-v2 — semantic clustering
Anthropic Python SDK — Claude Haiku summarisation
TextBlob — sentiment scoring (urgency boost signal)
Database
SQLite via SQLAlchemy ORM — zero ops, single file, perfect for hackathon
Tables: complaints, clusters, actions
Hosting
Backend: Railway.app (free tier, push-to-deploy Python, no Docker needed)
Frontend: Vercel (free tier, Vite/React auto-detected)
Or: run entirely on localhost — completely fine for demo
8. Step-by-Step Build Plan
Step 1 — Repo + Environment Setup (30 min) | All
# Backend
mkdir triage-api && cd triage-api
pip install fastapi uvicorn sqlalchemy spacy transformers torch \
            sentence-transformers anthropic textblob apscheduler
python -m spacy download en_core_web_sm

# Frontend
npm create vite@latest triage-ui -- --template react
cd triage-ui && npm install tailwindcss axios recharts
Agree on API contract (request/response shapes). Assign roles.

Step 2 — Database Models (45 min) | Backend dev
Define models.py with three tables: Complaint, Cluster, Action. Key fields: tweet_id (dedup key on Complaint), centroid_embedding (BLOB on Cluster), priority_score (computed float on Cluster).

class Complaint(Base):
    __tablename__ = "complaints"
    id          = Column(String, primary_key=True, default=lambda: f"TKT-{uuid4().hex[:8].upper()}")
    tweet_id    = Column(String, unique=True)   # dedup key
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
    id                = Column(String, primary_key=True)
    problem           = Column(String)
    summary           = Column(String)
    location          = Column(String)
    category          = Column(String)
    department        = Column(String)
    complaint_count   = Column(Integer, default=0)
    rt_reach          = Column(Integer, default=0)
    urgency           = Column(String)
    priority_score    = Column(Float, default=0.0)
    priority_rank     = Column(Integer)
    recommended_action= Column(String)
    status            = Column(String, default="pending")
    last_updated      = Column(DateTime)
Step 3 — NLP Pipeline (3 hrs) | ML dev (parallelisable with Step 4)
Build pipeline/ as a Python package with one function per module:

pipeline/
  normaliser.py    → clean_text(raw: str) -> str
  classifier.py    → classify(text: str) -> (category, confidence)
  ner.py           → extract_entities(text: str) -> dict
  urgency.py       → score_urgency(text: str, retweets: int) -> str
  clusterer.py     → find_or_create_cluster(post: dict) -> cluster_id
  summariser.py    → summarise_cluster(cluster: dict) -> str
  router.py        → route_department(category: str, location: str) -> str
  main.py          → process_post(raw_tweet: dict) -> ProcessedPost
Test each module independently before wiring. pipeline/main.py calls them in sequence.

Step 4 — FastAPI Endpoints (1.5 hrs) | Backend dev (parallelisable)
GET  /clusters              → list, filterable by dept/urgency/status, sorted by priority_score desc
GET  /clusters/{id}         → full detail + sample tweets
PUT  /clusters/{id}/status  → {"status": "assigned"|"resolved"|"escalated"}
GET  /stats                 → total complaints, by category, by urgency, trending cluster
POST /ingest (internal)     → called by ingestion service, not exposed to frontend
Test with FastAPI /docs before frontend is ready.

Step 5 — Ingestion Service (1 hr) | ML dev
# ingestion/mock_feed.py
import json, time, random
TWEETS = json.loads(Path("tweets.json").read_text())

def stream_mock_tweets(callback, interval=8):
    idx = 0
    while True:
        tweet = TWEETS[idx % len(TWEETS)]
        tweet["id"] = f"{tweet['id']}_{idx}"  # prevent dedup collision on loop
        callback(tweet)
        idx += 1
        time.sleep(interval + random.uniform(0, 2))

# main.py startup
@app.on_event("startup")
async def startup():
    load_all_models()           # warm spaCy + BART + sentence-transformers
    threading.Thread(
        target=stream_mock_tweets,
        args=(process_and_save,),
        daemon=True
    ).start()
Step 6 — Seed Data (45 min) | Any member
Generate tweets.json with 60–80 entries using GPT-4 (see Data Strategy section). Write seed.py that POSTs all tweets through the pipeline to pre-populate the DB. Run seed before demo. Never demo on an empty dashboard.

Step 7 — Dashboard UI (2.5 hrs) | Frontend dev (parallelisable with Steps 3–5)
Build three components:

ClusterCard.jsx — the ranked card with expand panel (see officer dashboard from earlier)
Sidebar.jsx — dept + location filters
StatsBar.jsx — total count, priority breakdown, last-ingested ticker
Poll GET /clusters every 5 seconds. Animate card entrance with CSS @keyframes.

Step 8 — Integration & CORS (30 min) | Both
app.add_middleware(CORSMiddleware, allow_origins=["*"])
Wire axios calls. Fix any payload mismatches between Pydantic schemas and React expectations. Full end-to-end test: post a tweet via seed script, watch it appear on dashboard.

Step 9 — Polish + Demo Prep (1 hr) | All
Load 25 pre-seeded clusters into DB via seed script
Prepare 5 "wow" trigger tweets (gas leak, pothole, water contamination — varied urgency)
Add "Trigger tweet" button on dashboard that fires a specific high-urgency tweet for demo
Ensure all error states fail gracefully (no blank screen on API timeout)
Sticky note on laptop: DO NOT RESTART SERVER DURING DEMO (models need to stay warm)
Step 10 — Deploy (30 min) | Any
Push backend to Railway.app (connect GitHub, auto-deploy Python)
Push frontend to Vercel (auto-detect Vite)
Or stay on localhost — perfectly fine, bring a hotspot
Parallelisation for Team of 4
| Member | Primary | Hours | |--------|---------|-------| | Dev 1 | FastAPI, DB models, API endpoints | 8–10 hrs | | Dev 2 | NLP pipeline (all modules) | 8–10 hrs | | Dev 3 | React dashboard UI | 6–8 hrs | | Dev 4 | Seed data, ingestion service, testing | 5–7 hrs |

Sync points: After Step 2 (agree on data shapes), after Step 8 (full integration test). No other blocking dependencies.

9. Demo Script
Pre-demo setup
Dashboard open in browser, 25 pre-seeded clusters visible
Mock feed running (ingestion ticking every 8 seconds — new complaints arriving visibly)
Terminal open showing uvicorn logs (optional — shows AI firing in real time)
5 demo tweets ready to trigger manually
Opening line (15 seconds)
"Every day, thousands of citizens post civic complaints on X. Right now, government staff are manually reading each one to figure out: what is this, how urgent, and who should handle it? We automated the entire triage pipeline. Zero new apps for citizens — they just use X as they already do."

Act 1 — Show the live dashboard (30 seconds)
Point to the cluster cards. Highlight the #1 priority card (water contamination, 412 complaints, red stripe).

"This is not a list of tweets. Each card is an issue cluster — the system has already grouped similar complaints, ranked them by complaint volume combined with social reach, and assigned them to the right department. The officer never reads a single tweet."

Scroll to the #2 card (Mayur Vihar potholes).

"287 complaints, all about the same road. One actionable brief. PWD assigned automatically."

Act 2 — Trigger a live high-urgency tweet (60 seconds)
Click "Trigger Demo Tweet" → fires the gas leak tweet (203 likes, 147 RTs).

Wait 2 seconds. A new #1 PRIORITY card appears at the top, bumping existing #1 down.

"That was a gas leak complaint from Vasant Kunj. Our urgency scorer detected 'gas leak' as a critical keyword. The retweet count — 147 — triggered our social signal boost. The system ranked this above 411 other complaints and routed it to Jal Board in under 2 seconds. No human involved."

Click to expand the card. Show:

AI-generated recommended action
Sample tweets from the cluster
SLA countdown
Act 3 — Show the officer taking action (30 seconds)
Click "Assign to Department" → status changes.

"One click. The DM's office has formally assigned this to Jal Board. That assignment is logged with a timestamp. Escalate sends it up the chain. Export Brief generates a one-page PDF summary for the morning review."

Act 4 — Filter and stats (20 seconds)
Click "PWD" in sidebar filter → only road/infrastructure clusters remain.

"A PWD engineer logs in and sees only their queue. No irrelevant noise."

Closing line (15 seconds)
"This works on live X data today — one environment variable swap from the mock feed to the real Twitter API. The same pipeline works for hospital complaint desks, campus admin portals, and 1800 civic helpline transcripts. The core insight: AI's job here is not to solve the problem — it's to make sure the right person sees it first."

10. Evaluation & Metrics
Classification accuracy
Run on 50 held-out complaints labelled manually. accuracy = correct_category / total Target: >75% for zero-shot BART, >85% if fine-tuned.

**For Inference (Real X Posts):**
- Raw X post data: `{"id", "text", "author", "created_at", "retweet_count", "url"}`

**No training data required** — BART zero-shot classification eliminates the need to collect and label training samples for classification.

### Mock Data (For Dev / Demo Replay):

```json
[
  {
    "text": "Pothole on MG Road near mosque, traffic accident risk! #complaints_gov",
    "retweet_count": 87,
    "category": "Infrastructure",
    "location": "MG Road",
    "urgency": "High",
    "department": "Public Works Department"
  },
  {
    "text": "Water tap not working in Sector 56 for 3 days #complaints_gov",
    "retweet_count": 12,
    "category": "Water",
    "location": "Sector 56",
    "urgency": "Medium",
    "department": "Water Works"
  },
  {
    "text": "Streetlight broken outside Govt School, Gurugram #complaints_gov",
    "retweet_count": 62,
    "category": "Infrastructure",
    "location": "Gurugram",
    "urgency": "High",
    "department": "Public Works Department"
  }
]
```

---

## 7. Tech Stack (Confirmed)

| Component | Choice | Why |
|-----------|--------|-----|
| **Backend Framework** | FastAPI (Python) | Fast, async, built-in API docs, ideal for ML pipelines |
| **Classification** | `facebook/bart-large-mnli` (zero-shot) | No training data needed; strong civic domain performance |
| **NER** | spaCy `en_core_web_sm` + custom EntityRuler | Fast, Indian-locale aware via custom gazetteer |
| **Urgency Scoring** | Hybrid keyword rules + retweet-count boost | Interpretable, fast, socially amplified |
| **Clustering** | `sentence-transformers/all-MiniLM-L6-v2` | Lightweight, CPU-friendly, strong semantic similarity |
| **LLM Summarisation** | Groq API — `llama3-8b-8192` | Free tier, no card, ~0.5s latency |
| **Database** | SQLite (MVP) → PostgreSQL (production) | Zero setup for hackathon |
| **Frontend** | React 18, Tailwind CSS, shadcn/ui, Recharts | Dark-themed, cluster card layout |
| **X Ingestion** | Tweepy FilteredStream / mock replay | Standard; swap one flag for live vs. mock |
| **Job Scheduling** | APScheduler (Python) | Lightweight background ingestion |
| **Real-Time Updates** | WebSocket / polling | Live dashboard updates |
| **Hosting (Optional)** | Vercel (frontend) + Railway/Render (backend) | Free tier, simple deploy |

**Why NOT:**
- ❌ OpenAI / Claude for summarisation — paid, card required; Groq free tier is sufficient
- ❌ scikit-learn classifier — needs labelled training data; BART zero-shot eliminates this
- ❌ Django: Too heavy for MVP
- ❌ MongoDB: SQL better for structured complaints data

---

## 8. Step-by-Step Build Plan

### Phase 1: Foundation (Hours 1–4) — **Parallel**

**Task 1a (Backend — Om/Dev 2):** FastAPI project, SQLite schema, X ingestion
- Create FastAPI project structure
- Define SQLite schema (add `retweet_count`, `cluster_id`, `priority_rank` fields)
- Write Tweepy FilteredStream client + mock replay mode
- `GET /api/complaints` endpoint

**Task 1b (Frontend Dev):** React dashboard skeleton
- Dark-themed layout: Header + cluster card list + expand panel
- Mock data cards showing priority rank, category, urgency badge, location
- Routing: list view → detail view

**Deliverable:** Backend returns mock complaints; frontend displays ranked cluster cards.

---

### Phase 2: ML Pipeline (Hours 5–8) — **Dev 2 owned (branch: pipeline/ai-migration-fixes)**

**Status: ✅ Smoke-tested — all models load and process correctly**

- BART zero-shot classification ✅
- spaCy + EntityRuler NER ✅
- Hybrid urgency scorer ✅
- sentence-transformers clustering ✅
- Groq summarisation ✅
- `/api/process` endpoint: raw text + retweet_count → structured JSON

**Deliverable:** Hit `/api/process` with raw X post → get back `{category, location, urgency, cluster_id, summary, priority_rank}`

---

### Phase 3: Integration (Hours 9–12) — **Parallel**

**Task 3a (Backend):** Wire pipeline to ingestion
- Ingestion job calls `/api/process` per post, stores results in DB
- Filtering endpoints: `/api/complaints?category=Infrastructure&urgency=High`
- Cluster aggregation endpoint: `/api/clusters` (ranked by priority score)

**Task 3b (Frontend):** Interactive dashboard
- Real-time cluster cards ranked by priority_score
- Expand panel: grouped complaint tweets + officer brief + action buttons
- Filters (category, urgency, department)
- Assign / Resolve / Escalate / Export Brief actions

**Deliverable:** Full end-to-end: X post → pipeline → ranked cluster card in dashboard

---

### Phase 4: Polish & Demo (Hours 13–24) — **Buffer**

- Test with real X posts (mock replay if quota tight)
- Tune EntityRuler gazetteer for Gurugram/local landmarks
- Add metrics panel: total clusters, urgency distribution, avg processing time
- Write demo script; prepare 3–4 example posts
- Deploy (Vercel + Railway)
- Merge `pipeline/ai-migration-fixes` → integration branch after stash resolution

---

### Parallelization:
- **Om (Dev 2):** Pipeline code (done ✅) → Phase 3a integration → stash resolution → merge
- **Frontend Dev:** Phase 1b → Phase 3b → polish
- **Others:** Mock data prep, NER gazetteer expansion, demo script, testing

---

## 9. Demo Script (CRITICAL)

### Setup:
- Mock replay loaded with 10–15 pre-processed complaints
- Dashboard open (dark theme, cluster cards visible)
- Terminal showing live API calls on second screen

### Demo Flow (5 minutes):

**Intro (30 sec):**
> "Governments get thousands of complaints on X every day — potholes, water cuts, broken lights. The problem: no one systematically reads them. We built a system that ingests complaints automatically, runs them through an AI pipeline, and surfaces ranked action briefs to officers. Let me show you."

**Demo Part 1: Ingestion (1 min):**
> "I'll post a complaint on X right now with #complaints_gov..."
- Post: "Broken streetlight on MG Road. Kids can't walk to school safely. PLEASE FIX!"
- Wait ~10 seconds → cluster card appears or updates in dashboard

**Demo Part 2: AI Pipeline Output (2 min):**
> "Watch what the system extracted automatically..."
- Click cluster card → expand panel
- Show:
  - **Category:** Infrastructure (BART zero-shot)
  - **Location:** MG Road (spaCy + EntityRuler)
  - **Urgency:** High (keyword: "PLEASE FIX" + retweet boost)
  - **Department:** Public Works Department
  - **Officer Brief:** "Streetlight outage on MG Road near school — immediate safety risk, assign to PWD"
  - **Cluster:** 2 similar complaints grouped → "12 retweets combined"

**Demo Part 3: Prioritization (1.5 min):**
> "Officers don't see a raw tweet feed — they see ranked priorities."
- Show cluster #1 (high retweet + high urgency)
- Show cluster #2 (lower reach, Medium urgency)
- Filter by "High Urgency" → 3 clusters
- Click Assign on cluster #1 → status updates

**Demo Part 4: Value (30 sec):**
> "Instead of a clerk manually reading 200 tweets and guessing which department, the system ranks the top issues in under 2 seconds. Government can now focus on fixing problems, not finding them."

### Key Points:
- ✅ Show **ranked cluster cards**, not raw tweets — this is the differentiator
- ✅ Show **retweet-boost effect** (explain why #1 card is #1)
- ✅ Show **all 5 pipeline steps** working
- ✅ Show **speed** (<2 sec end-to-end)
- ✅ Have a "low confidence" example ready — show "Manual Review" flag honestly

---

## 10. Evaluation & Metrics

### During Development:

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Classification Accuracy** | >85% on 30 test complaints | Manual spot-check vs. BART output |
| **Location Extraction** | >75% on Indian locality test set | Spot-check 10 extractions with EntityRuler |
| **Urgency Detection** | >80% on test set | Compare rule output vs. manual label |
| **Clustering Quality** | Similar complaints grouped | Visual inspection of 3–4 cluster groups |
| **Summarization Quality** | Clear, actionable, <2 sentences | Read 5 briefs: "Would an officer act on this?" |
| **End-to-End Latency** | <5 sec from post to dashboard | Time from ingestion to DB write |

### For Demo Judges:

**They'll care about:**
1. **Accuracy:** Correct category + location? (Spot-check 3 examples live)
2. **Speed:** <5 sec end-to-end
3. **Prioritization:** Does the ranking make sense?
4. **Clarity:** Officer briefs readable and actionable?
5. **Real Problem:** Manual triage is slow — does this solve it?

### Metrics Panel (Dashboard):
```
Total Clusters: 12      Total Complaints: 47
├─ By Urgency:    High (5 clusters), Medium (4), Low (3)
├─ By Category:   Infrastructure (6), Water (3), Health (2), Other (1)
├─ By Department: PWD (6), Water Works (3), Health Dept (2), Unknown (1)
└─ Avg Processing Time: 1.8 sec
```

---

## 11. Stretch Features (If Time Permits)

### Stretch 1: Department Email Routing
- SMTP auto-email to department inboxes on "Assign" click
- Template: `[URGENT] Pothole cluster (5 complaints) on MG Road — #complaints_gov`
- **Time:** +2 hours

### Stretch 2: Citizen Feedback Loop
- QR code on dashboard → citizens rate if issue resolved
- Feedback stored → future prioritization weight
- **Time:** +3 hours

### Stretch 3: Multi-Language Support
- `langdetect` → Google Translate API → process in English → return in original
- **Time:** +2 hours

### Stretch 4: Geospatial Mapping
- Folium/Mapbox: plot all cluster centroids
- Heatmap by urgency
- **Time:** +3 hours

### Stretch 5: Hindi/Regional Complaint Support
- Extend EntityRuler gazetteer with Hindi transliterations of localities
- **Time:** +2 hours

---

## 12. Risks & Smart Shortcuts

### Risk 1: X API Rate Limits
- **Problem:** X API free tier burns quota fast
- **Smart Shortcut:** Use mock replay for demo; 1–2 real posts if quota allows
- **Solution:** Pre-fetch 20 posts before demo; use replay mode (one flag in ingestion)

### Risk 2: BART is Slow on CPU
- **Problem:** `bart-large-mnli` can take 3–5 sec per post on CPU
- **Smart Shortcut:** Pre-compute classifications on all mock data before demo
- **Solution:** Cache predictions in DB; pipeline runs async in background

### Risk 3: NER Misses Informal Indian Locations
- **Problem:** spaCy misses "near the mosque", "Sector 56 chowk"
- **Smart Shortcut:** EntityRuler gazetteer covers known locals; accept ~70% extraction rate
- **Solution:** "Location: unclear" shown honestly; manual review flag triggered

### Risk 4: Groq API Down / Rate Limited
- **Problem:** Groq free tier has per-minute limits
- **Smart Shortcut:** Cache summaries in DB; regenerate only on new clusters
- **Solution:** Fallback to extractive summary (first + last sentence) if Groq unavailable

### Risk 5: Git / Branch Merge Conflicts
- **Problem:** pipeline/ai-migration-fixes not merged; stash issue on main
- **Smart Shortcut:** Resolve stash first (see git stash resolution guide); create PR to integration branch
- **Solution:** Each dev works on named branches; merge sequentially via PRs to avoid conflicts

### Risk 6: Judges Test Edge Cases
- **Problem:** Sarcastic or unrelated tweet with hashtag
- **Smart Shortcut:** Show confidence score; anything <0.6 flagged "Manual Review"
- **Solution:** Don't promise 100% accuracy — "captures 85%+ of real-world complaints"

### Risk 7: Frontend Not Ready
- **Problem:** ML pipeline done but frontend still building
- **Smart Shortcut:** Demo with `/api/clusters` JSON directly if needed; frontend is visual polish
- **Solution:** API-first development; frontend swaps mock → real data with one URL change

### Smart Shortcut: Deterministic Department Routing
```python
category_to_dept = {
    "Infrastructure": "Public Works Department",
    "Water": "Water Works",
    "Health": "Health Ministry",
    "Sanitation": "Municipal Corporation",
    "Safety": "Police / Disaster Management",
    "Other": "District Collector Office"
}
```
NER location extraction
Manual check on 30 examples. location_precision = correctly_extracted / total_with_location Target: >80%.

Clustering coherence
Manual review: pick 5 clusters, read all member tweets. Do they belong together? Target: >4/5 clusters pass the smell test. Threshold-tune if not.

Urgency alignment
Compare system urgency vs manual labelling on 30 examples. Target: >85% match. Clear extremes (gas leak = critical, paint = low) must be correct.

Pipeline latency
Time process_post() end-to-end including Claude API call. Target: <2.5 seconds per tweet. Measure with time.perf_counter().

Dashboard usability (informal)
Can a judge find the 3 most urgent complaints in under 10 seconds? That is the usability bar. If not, reorder the card layout.

11. Stretch Features
1. Live X stream via tweepy
Swap stream_mock_tweets for tweepy.StreamingClient filtered on #complaints_gov. Impact: Demo processes real tweets in real time. Judges see a live complaint appear from an actual citizen. Effort: ~2 hours if X developer account is already set up.

2. Heatmap of complaint density by location
Use react-leaflet + OpenStreetMap. Geocode extracted locations with Nominatim (free API). Plot cluster pins colour-coded by urgency. Impact: Judges immediately see where the city is suffering. Geographic view is the strongest visual in any civic tech demo. Effort: 3–4 hours.

3. Auto-reply draft generation
After cluster summary is generated, produce a draft acknowledgment reply for the citizen:

"Your complaint about potholes on Mayur Vihar main road (Ticket TKT-0047) has been forwarded to PWD. Expected response: 48 hours." Show as "Draft Reply" card. Officer can send in one click (simulated). Impact: Closes the loop — demonstrates the system helps both officers AND citizens. Effort: 1 hour (Claude prompt addition).

4. Duplicate / spam detection
Flag tweets that are clearly copy-paste (bot amplification). Use Jaccard similarity on tweet text before embedding. Tweets >0.95 Jaccard to an existing member → marked as duplicate, not counted in complaint_count. Impact: Prevents artificial urgency inflation via bot campaigns. A real governance concern. Effort: 1.5 hours.

5. Weekly trend analytics panel
A second dashboard tab showing complaint volume by category over the past 7 days as a heatmap grid (day × category → cell colour = volume). Reveals systemic vs one-off problems. Impact: Reframes the product from "real-time triage" to "strategic intelligence" — a much bigger story. Effort: 2–3 hours (Recharts heatmap + historical DB query).

12. Risks & Smart Shortcuts
Risk 1 — Model cold start too slow (BART takes 8–12s to load)
Fix: Load all models inside @app.on_event("startup"). Never restart the server during demo. Put a sticky note on the laptop lid: NO RESTARTS.

Risk 2 — Zero-shot BART latency is too high (>1s per tweet)
Fix: Pre-classify all 60 seed tweets and store results in DB. During the demo, only the 5 manually triggered tweets go through the live pipeline — everything else is pre-processed. Judges cannot tell the difference.

Risk 3 — Claude API is down or rate-limited
Fix: Pre-generate summaries for all 25 demo clusters. Store in a cache/summaries.json file. If API call fails, serve from cache. Never show a blank summary during demo.

- [x] Dev 2 pipeline code complete (branch: pipeline/ai-migration-fixes)
- [x] Smoke test: all models load and process correctly
- [ ] Resolve git stash issue on main branch
- [ ] Merge pipeline branch → integration branch (PR)
- [ ] Backend: FastAPI project + SQLite schema (add retweet_count, cluster_id, priority_rank)
- [ ] X API: Tweepy FilteredStream + mock replay mode
- [ ] Backend: `/api/complaints`, `/api/process`, `/api/clusters` endpoints
- [ ] Frontend: Dark-themed dashboard skeleton + cluster card component
- [ ] Integration: Wire ML pipeline to ingestion job
- [ ] Frontend: Ranked cluster cards, expand panel, action buttons, filters
- [ ] Testing: End-to-end with 10–15 test complaints
- [ ] Polish: Metrics panel, confidence badges, "Manual Review" flag
- [ ] Demo: Prepare 3–4 example X posts, write script, test mock replay
- [ ] Deployment: Vercel (frontend) + Railway (backend)
- [ ] Documentation: README updated ✅
Risk 4 — spaCy misses Indian location names
Fix: Build a 100-entry gazetteer of the specific location names in your seed tweets. Run dict lookup before spaCy. This covers 100% of demo inputs deterministically.

Risk 5 — Dashboard looks unpolished
Fix: Use the pre-built officer dashboard HTML from earlier as your starting point. Do not build UI from scratch. shadcn/ui gives you production-grade components in minutes.

Risk 6 — No internet at demo venue
Fix: Download all model weights locally before the event (transformers caches to ~/.cache/huggingface). Replace Claude API call with BART-CNN summarisation. Pack a mobile hotspot. Run everything on localhost.

✅ **System works end-to-end:** X post → pipeline → ranked cluster card in dashboard (<5 sec)
✅ **ML accuracy:** >80% on category classification (BART zero-shot)
✅ **Clustering works:** Similar complaints grouped; priority rank visible and logical
✅ **Dashboard is usable:** Ranked cards, expand panel, officer actions functional
✅ **Demo is smooth:** 3 examples without errors, judges understand the value
✅ **Code is clean:** Each module (ingest, classify, NER, cluster, summarise) independently testable
Risk 7 — Clustering creates one giant cluster (threshold too low)
Fix: If you see this during testing, raise the cosine similarity threshold from 0.82 to 0.87. Test with your seed data the night before. Do not tune on the morning of the demo.

Risk 8 — Demo on empty dashboard
Always run seed.py before presenting. This is the single most common hackathon demo mistake. The dashboard needs 20–25 clusters pre-loaded. Without them the system looks like a prototype, not a product.