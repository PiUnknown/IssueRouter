# IssueRouter — Project Specification
### Engineering Context Document for Cold-Start Rebuild
**Team Convergence · HNC 3.0 · 2026**

---

> This document contains everything an engineer or AI agent needs to understand, replicate, extend, or continue building IssueRouter from any point. Read this before touching any code.

---

## 1. Project Identity

**Name:** IssueRouter
**Tagline:** Noise to Action
**Team:** Team Convergence
**Hackathon:** HNC 3.0 — 3rd Place
**Repository:** github.com/PiUnknown/IssueRouter
**Primary branch:** main (protected — all changes via PR)

---

## 2. Core Problem Statement

Government departments in India receive thousands of unstructured civic complaints daily on X (Twitter). The complaints arrive without category, location, urgency, or department assignment. Staff manually read, categorise, and forward each one. At scale this is impossible.

**The bottleneck is not resolution. It is sorting.**

IssueRouter automates the entire triage process — from raw social media text to structured, ranked, department-routed action briefs — without requiring citizens to change their behaviour.

---

## 3. System Overview

```
[tweets.json]
      ↓
[seed_db.py] → inserts raw tweets into SQLite raw_tweets table
      ↓
[db_feed.py] → reads one unprocessed tweet every 8 seconds
      ↓
[normaliser.py] → cleans raw text
      ↓
[classifier.py] → assigns category (BART zero-shot)
      ↓
[ner.py] → extracts location + department (spaCy + gazetteer)
      ↓
[urgency.py] → scores urgency (keywords + RT boost)
      ↓
[router.py] → maps category + city → department
      ↓
[clusterer.py] → finds or creates cluster (cosine similarity 0.70)
      ↓
[summariser.py] → generates officer brief (Groq llama-3.1-8b-instant)
      ↓
[SQLite DB] → saves complaint + updates cluster
      ↓
[FastAPI] → serves GET /clusters, GET /stats, PUT /clusters/{id}/status
      ↓
[React Dashboard] → polls every 5s, renders priority-ranked cluster cards
```

---

## 4. Repository Structure

```
IssueRouter/
├── backend/
│   ├── main.py                    ← FastAPI app entry + startup + process_and_save
│   ├── seed_db.py                 ← loads tweets.json into raw_tweets table
│   ├── requirements.txt
│   ├── .env                       ← GROQ_API_KEY, DATABASE_URL (never commit)
│   ├── .env.example               ← committed template
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py            ← SQLAlchemy engine, Base, SessionLocal
│   │   ├── models.py              ← RawTweet, Complaint, Cluster, Action tables
│   │   └── schemas.py             ← Pydantic request/response models
│   │
│   ├── ingestion/
│   │   ├── __init__.py
│   │   ├── normaliser.py          ← cleans raw tweet text
│   │   ├── db_feed.py             ← reads from raw_tweets table (current)
│   │   ├── mock_feed.py           ← reads from tweets.json (legacy)
│   │   ├── x_listener.py         ← tweepy real stream (post-hackathon)
│   │   └── tweets.json            ← 63 mock tweets (seed data)
│   │
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── classifier.py          ← BART zero-shot category assignment
│   │   ├── ner.py                 ← spaCy NER + Indian gazetteer
│   │   ├── urgency.py             ← keyword rules + RT social signal
│   │   ├── router.py              ← category + city → department mapping
│   │   ├── clusterer.py           ← sentence-transformers cosine clustering
│   │   ├── summariser.py          ← Groq LLM one-line brief generation
│   │   └── main.py                ← orchestrator, exports process_post()
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── clusters.py            ← GET /clusters, GET /clusters/{id}
│   │   ├── actions.py             ← PUT /clusters/{id}/status
│   │   └── stats.py               ← GET /stats
│   │
│   ├── cache/
│   │   └── summaries.json         ← cached Groq summaries (fallback)
│   │
│   └── tests/
│       ├── test_classifier.py
│       ├── test_ner.py
│       └── test_urgency.py
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/client.js
│       ├── components/
│       │   ├── ClusterCard.jsx
│       │   ├── Sidebar.jsx
│       │   ├── StatsBar.jsx
│       │   ├── DemoTrigger.jsx
│       │   └── DeptBadge.jsx
│       ├── pages/Dashboard.jsx
│       └── hooks/
│           ├── useClusters.js
│           └── useStats.js
│
├── .gitignore
└── README.md
```

---

## 5. Database Schema

### Table: raw_tweets
Stores all incoming tweets before processing.
```
id          String  PRIMARY KEY   (tweet ID from source)
username    String                (@handle)
text        String                (raw tweet text)
likes       Integer DEFAULT 0
retweets    Integer DEFAULT 0
created_at  String
processed   Boolean DEFAULT False  ← KEY FIELD: False = waiting, True = done
inserted_at DateTime DEFAULT now
```

### Table: complaints
Stores each tweet after pipeline processing.
```
id          String  PRIMARY KEY   (TKT-XXXXXXXX auto-generated)
tweet_id    String  UNIQUE        (dedup key)
username    String
raw_text    String
clean_text  String
cluster_id  String  FOREIGN KEY → clusters.id
category    String
urgency     String
location    String
retweets    Integer DEFAULT 0
likes       Integer DEFAULT 0
timestamp   DateTime DEFAULT now
```

### Table: clusters
Stores grouped issue clusters.
```
id                  String  PRIMARY KEY   (CLU-XXXXXX auto-generated)
problem             String                (human-readable title)
summary             String                (Groq-generated officer brief)
location            String
category            String
department          String
complaint_count     Integer DEFAULT 0
rt_reach            Integer DEFAULT 0     (cumulative retweets)
urgency             String
priority_score      Float   DEFAULT 0.0  (ranking formula output)
recommended_action  String                (Groq-generated action)
status              String  DEFAULT pending
centroid_embedding  String                (JSON-encoded float list, 384 dims)
last_updated        DateTime
```

### Table: actions
Logs officer actions.
```
id          String  PRIMARY KEY   (auto-generated)
cluster_id  String  FOREIGN KEY → clusters.id
action      String                (assigned/resolved/escalated)
timestamp   DateTime DEFAULT now
```

---

## 6. API Contract

All endpoints return JSON. Base URL: http://localhost:8000

```
GET  /clusters
     Query params: dept (string), urgency (string), status (string)
     Returns: {
       clusters: [ClusterObject, ...],
       total: int
     }
     ClusterObject fields: id, problem, summary, location, category,
       department, complaint_count, rt_reach, urgency, priority_score,
       recommended_action, status, last_updated

GET  /clusters/{cluster_id}
     Returns: ClusterObject + sample_tweets: [{username, text}, ...]

PUT  /clusters/{cluster_id}/status
     Body: { "status": "assigned" | "resolved" | "escalated" }
     Returns: { success: true, status: string }

GET  /stats
     Returns: {
       total_complaints: int,
       total_clusters: int,
       by_urgency: { critical: int, high: int, medium: int, low: int },
       by_dept: { "PWD": int, "Jal Board": int, ... }
     }
```

---

## 7. Pipeline Engineering Decisions

### 7.1 Classifier — BART Zero-Shot
- **Model:** facebook/bart-large-mnli
- **Why:** No training data required. Works out of the box on civic text.
- **Accuracy:** ~80-85% on civic complaint text
- **Latency:** ~400ms per tweet
- **Loading:** Load once at startup via load_all_models(). Never reload during runtime.
- **Categories:** Infrastructure, Sanitation, Healthcare, Utilities, Education, Law and Order, Environment
- **Fallback:** None — if model fails to load, server startup fails (intentional)

### 7.2 NER — spaCy + EntityRuler
- **Model:** en_core_web_sm (12MB, <10ms inference)
- **Enhancement:** Custom EntityRuler with ~30 Indian locality and department patterns
- **Order:** EntityRuler runs BEFORE spaCy's built-in NER (before="ner")
- **Fallback:** Substring match on gazetteer dict as pre-spaCy step
- **Known gap:** Struggles with pure transliterated Hindi — Hinglish works

### 7.3 Urgency — Hybrid Keyword + Social Signal
- **Primary signal:** Keyword matching in four tiers (critical → high → medium → low)
- **Secondary signal:** Retweet count boost
  - retweets > 100 AND base == medium → high
  - retweets > 500 AND base == high → critical
- **Priority weight:** critical=200, high=100, medium=40, low=10
- **Priority formula:** (complaint_count × 1.0) + (rt_reach × 0.3) + urgency_weight

### 7.4 Router — Rule-Based Department Mapping
- **Approach:** Python dictionary, category → department
- **City override:** Secondary dict checks if location contains city name, applies city-specific department
- **Cities handled:** Delhi (default), Mumbai (MCGM), Bangalore (BBMP/BESCOM), Noida
- **Fallback:** "Municipal Corporation" if no match found

### 7.5 Clusterer — Semantic Cosine Similarity
- **Model:** sentence-transformers/all-MiniLM-L6-v2 (80MB, ~20ms inference)
- **Embedding dimension:** 384
- **Similarity metric:** Cosine similarity
- **Threshold:** 0.70 (lower = more aggressive clustering, higher = stricter)
- **Category gate:** Only compare tweets of the same category
- **Centroid update:** Running average formula — (old × (n-1) + new) / n
- **Storage:** Centroid stored as JSON-encoded string in clusters.centroid_embedding

### 7.6 Summariser — Groq LLM
- **Provider:** Groq API
- **Model:** llama-3.1-8b-instant
- **Trigger:** Only called at complaint count milestones: 1, 10, 50, 100, 250
- **Max tokens:** 100 for summary, 60 for recommended action
- **Caching:** All outputs saved to cache/summaries.json keyed as {cluster_id}_{count}
- **Fallback:** Rule-based string if API fails or key is missing
- **Client init:** groq.Groq(api_key=os.environ.get("GROQ_API_KEY"))
- **API call syntax:** client.chat.completions.create(model=..., messages=[...])

---

## 8. Ingestion Engineering

### DB-Feed Pattern (current implementation)
The system does NOT read directly from tweets.json at runtime. The flow is:

1. `seed_db.py` runs once, loads all tweets.json entries into raw_tweets table with processed=False
2. `db_feed.py` background thread queries for the oldest unprocessed tweet
3. Tweet is passed to process_and_save() callback
4. On success: tweet.processed = True, db.commit()
5. On failure: db.rollback(), tweet remains unprocessed and will be retried
6. Thread sleeps 8 seconds, then queries for next unprocessed tweet

**Why this pattern over direct JSON streaming:**
- Server restart safety: unprocessed tweets remain in queue
- Deduplication: tweet_id unique constraint prevents double-counting
- Auditability: processed flag creates a clear audit trail
- Decoupling: ingestion source (file/API/webhook) is separated from processing

### To reset and reprocess:
```
Remove-Item backend/issuerouter.db -Force
python seed_db.py
uvicorn main:app --reload --port 8000
```

### To go live (post-hackathon):
In main.py, replace:
```python
from ingestion.db_feed import stream_from_db
thread = threading.Thread(target=stream_from_db, args=(process_and_save,))
```
with:
```python
from ingestion.x_listener import stream_real_tweets
thread = threading.Thread(target=stream_real_tweets, args=(process_and_save,))
```
Add X_BEARER_TOKEN to .env. No other changes needed.

---

## 9. Environment Configuration

### Required .env variables
```
GROQ_API_KEY=gsk_...          # Get free at console.groq.com
DATABASE_URL=sqlite:///./issuerouter.db
```

### Optional .env variables
```
MOCK_FEED_INTERVAL=8          # Seconds between tweets (default 8)
CLUSTER_SIMILARITY_THRESHOLD=0.70   # Cosine threshold (default 0.70)
X_BEARER_TOKEN=...            # Only needed for live X stream
```

### Load order in main.py
```python
from dotenv import load_dotenv
load_dotenv()   # MUST be first two lines before any other imports
```

---

## 10. Python Dependencies

```
fastapi
uvicorn
sqlalchemy
spacy (+ en_core_web_sm model via python -m spacy download en_core_web_sm)
sentence-transformers
transformers
torch
groq
python-dotenv
scikit-learn (for cosine_similarity)
```

Windows-specific: Microsoft Visual C++ Redistributable required for PyTorch DLL loading.
Download: https://aka.ms/vs/17/release/vc_redist.x64.exe

---

## 11. Frontend Engineering

### Polling Architecture
The frontend does NOT use WebSockets. It uses simple HTTP polling:
- useClusters.js: GET /clusters every 5000ms
- useStats.js: GET /stats every 10000ms

### Component Hierarchy
```
Dashboard.jsx
├── StatsBar.jsx
├── Sidebar.jsx (emits filter state)
├── DemoTrigger.jsx
└── ClusterCard.jsx (one per cluster, expandable)
    └── DeptBadge.jsx
```

### API Client
All HTTP calls go through frontend/src/api/client.js (axios instance).
Base URL is set from VITE_API_URL environment variable (default http://localhost:8000).

### Priority-Sorted Display
Clusters are sorted by priority_score descending. The highest score is #1 on the dashboard. Sorting happens on the backend (ORDER BY priority_score DESC) not the frontend.

---

## 12. Git Workflow

### Branch naming
```
backend/{feature}      ← Dev 1
pipeline/{feature}     ← Dev 2
frontend/{feature}     ← Dev 3
infra/{feature}        ← Dev 4
docs/{feature}         ← any member
```

### Rules
- No direct push to main — branch protection enforced
- All changes via Pull Request with at least 1 approval
- Commit format: type(scope): description
  - feat(pipeline): add BART classifier
  - fix(ingestion): prevent duplicate tweet_id on loop
  - chore(deps): add groq to requirements.txt
- Pull from main every 2 hours minimum during active development

### File ownership
- backend/db/ and backend/api/ → Dev 1 only
- backend/pipeline/ and backend/ingestion/ → Dev 2 only
- frontend/src/ → Dev 3 and Dev 4 only
- tweets.json → Dev 4 only

---

## 13. Known Issues and Workarounds

### Issue: spaCy DLL load failure on Windows
Cause: Microsoft Visual C++ Redistributable not installed
Fix: Install from https://aka.ms/vs/17/release/vc_redist.x64.exe

### Issue: GROQ_API_KEY not loading from .env
Cause: load_dotenv() not called before Groq client initialisation
Fix: Ensure `from dotenv import load_dotenv; load_dotenv()` is the first two lines of main.py

### Issue: No module named 'pipeline'
Cause: Running uvicorn from wrong directory, or missing __init__.py files
Fix: Always run uvicorn from inside backend/ directory. Ensure __init__.py exists in pipeline/, ingestion/, api/, db/

### Issue: All tweets creating separate clusters (no grouping)
Cause: Cosine similarity threshold too high, or tweet texts are too different
Fix: Lower SIMILARITY_THRESHOLD from 0.82 to 0.70 in clusterer.py

### Issue: All urgency showing as Low
Cause: Mock tweets do not contain urgency keywords
Fix: Use the provided tweets.json with diverse urgency vocabulary

### Issue: summariser.py error 'Groq object has no attribute messages'
Cause: Old Claude API syntax used instead of Groq syntax
Fix: Use client.chat.completions.create() not client.messages.create()

### Issue: venv not activating on Windows PowerShell
Cause: Execution policy restriction
Fix: Run Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

### Issue: Desktop path not found (OneDrive users)
Cause: OneDrive syncs Desktop to a different path
Fix: Use C:\Users\{username}\OneDrive\Desktop instead of C:\Users\{username}\Desktop

---

## 14. Performance Characteristics

| Operation | Typical Time |
|-----------|-------------|
| BART model cold load | 8-12 seconds |
| spaCy model load | <1 second |
| sentence-transformers load | 2-3 seconds |
| BART inference (per tweet) | ~400ms |
| spaCy NER (per tweet) | <10ms |
| sentence-transformers embedding | ~20ms |
| Groq API call (summariser) | ~100ms |
| Full pipeline per tweet | ~500-600ms |
| Dashboard poll cycle | 5 seconds |
| Tweet ingestion interval | 8 seconds |

---

## 15. Scaling Notes

### Current scale (hackathon)
- 1 district, SQLite, single-threaded ingestion, ~60-100 tweets/session

### Medium scale (pilot city)
- Replace SQLite with PostgreSQL
- Add connection pooling (SQLAlchemy pool_size=10)
- Batch BART inference (process 8-16 tweets per call instead of one)

### National scale (766 districts)
- Add Redis message queue between ingestion and pipeline
- Multiple pipeline worker processes pulling from queue
- 1 Hetzner CX41 server handles 10-15 districts simultaneously
- 52 servers total for all 766 Indian districts
- Estimated cost: ~$900/month total ($1.15/district/month)

---

## 16. Rebuild Instructions (Cold Start)

If you are starting from the repository with empty files, build in this exact order:

1. **db/database.py** — engine, Base, SessionLocal
2. **db/models.py** — RawTweet, Complaint, Cluster, Action
3. **db/schemas.py** — Pydantic response models
4. **ingestion/normaliser.py** — clean_text() function
5. **pipeline/classifier.py** — load_classifier(), classify()
6. **pipeline/ner.py** — load_ner(), extract_entities()
7. **pipeline/urgency.py** — score_urgency(), get_urgency_weight()
8. **pipeline/router.py** — route_department()
9. **pipeline/clusterer.py** — load_clusterer(), get_embedding(), find_matching_cluster(), update_centroid()
10. **pipeline/summariser.py** — summarise_cluster(), generate_recommended_action()
11. **pipeline/main.py** — load_all_models(), process_post()
12. **ingestion/db_feed.py** — stream_from_db()
13. **api/clusters.py** — GET /clusters, GET /clusters/{id}
14. **api/actions.py** — PUT /clusters/{id}/status
15. **api/stats.py** — GET /stats
16. **main.py** — FastAPI app, process_and_save(), startup()
17. **seed_db.py** — seed() function
18. **ingestion/tweets.json** — 63 diverse mock tweets
19. **cache/summaries.json** — empty: {}

Test each pipeline module independently before wiring in main.py.

---

## 17. Demo Instructions

### Pre-demo (do this 30 minutes before)
```
1. Delete issuerouter.db
2. python seed_db.py
3. uvicorn main:app --port 8000
4. npm run dev (in frontend/)
5. Wait for all 63 tweets to process (~9 minutes at 8s interval)
6. Verify dashboard shows 10-16 cluster cards
7. DO NOT restart the server after this point
```

### Demo flow
1. Show dashboard — point to priority #1 card (should be gas leak or sewage overflow)
2. Show RT reach numbers — explain social signal urgency
3. Expand a card — show AI-generated summary and recommended action
4. Click DemoTrigger — inject a high-urgency gas leak tweet manually
5. Wait 8 seconds — new #1 PRIORITY card appears
6. Click Assign — show status update
7. Filter by PWD — show only road complaints
8. Close with: "AI's job here is not to solve the problem — it's to make sure the right person sees it first."

---

*IssueRouter Project Specification · Team Convergence · 2026*
*This document provides full cold-start context for any engineer or AI agent continuing this project.*
