# IssueRouter
### Noise to Action
**Team Convergence** · HNC 3.0 Hackathon · April 2026 · 🥉 3rd Place

---

## What is IssueRouter?

IssueRouter is an AI-powered civic grievance triage system that automatically ingests citizen complaints posted on X (Twitter), processes them through a six-stage NLP pipeline, groups similar complaints into clusters, and surfaces ranked actionable briefs on a real-time officer dashboard — without any human involvement in the sorting process.

Citizens already complain on X. They don't need a new app. We listen.

---

## The Problem

Every day, thousands of citizens post civic complaints on X — potholes, water contamination, power cuts, garbage overflow. Government departments have no systematic way to monitor, sort, or prioritise this. Staff manually read tweets, guess which department is responsible, and forward them one by one.

**The bottleneck is not resolution. It is sorting.**

At 500–1000 complaints per day per district, a single officer would need 8+ hours just reading and routing before doing any actual work. Manual triage is impossible at this scale.

---

## How It Works — End to End

```
Citizens post on X with #complaints_gov
            ↓
tweets.json (mock data) loaded into SQLite via seed_db.py
            ↓
db_feed.py picks up unprocessed tweets from raw_tweets table (every 8s)
            ↓
normaliser.py strips @mentions, URLs, hashtags from raw text
            ↓
classifier.py (BART zero-shot) → assigns category
            ↓
ner.py (spaCy + gazetteer) → extracts location and department
            ↓
urgency.py → keyword rules + retweet boost → urgency level
            ↓
router.py → category + city → responsible department
            ↓
clusterer.py → cosine similarity → match or create cluster
            ↓
summariser.py (Groq llama-3.1-8b-instant) → one-line officer brief
            ↓
Saved to SQLite (complaints + clusters + actions tables)
            ↓
FastAPI serves data via REST endpoints
            ↓
React dashboard polls every 5s → renders ranked cluster cards
```

---

## Current Working Status

| Component | Status | Notes |
|-----------|--------|-------|
| Mock feed ingestion | ✅ Working | Reads from raw_tweets table in SQLite |
| Post normaliser | ✅ Working | Strips noise from raw tweet text |
| BART classifier | ✅ Working | Zero-shot, ~400ms per tweet |
| spaCy NER | ✅ Working | Custom Indian locality gazetteer |
| Urgency scorer | ✅ Working | Keyword rules + RT boost |
| Department router | ✅ Working | City-aware mapping |
| Semantic clusterer | ✅ Working | Threshold: 0.70 cosine similarity |
| Groq summariser | ✅ Working | llama-3.1-8b-instant, free tier |
| FastAPI backend | ✅ Working | All endpoints live |
| SQLite database | ✅ Working | 3 tables: complaints, clusters, actions |
| React dashboard | ✅ Working | Priority-ranked cluster cards |
| Real X scraping | ⏳ Post-hackathon | One function swap with tweepy |
| WhatsApp intake | ⏳ Stretch feature | WhatsApp Business API |
| Map view | ⏳ Stretch feature | react-leaflet + Nominatim |

---

## Folder Structure

```
IssueRouter/
│
├── backend/
│   ├── main.py                   ← FastAPI app entry point + startup wiring
│   ├── seed_db.py                ← loads tweets.json into raw_tweets table
│   ├── requirements.txt          ← all Python dependencies
│   ├── .env                      ← API keys (never commit this)
│   ├── .env.example              ← template for .env
│   │
│   ├── db/
│   │   ├── database.py           ← SQLAlchemy engine, session, Base
│   │   ├── models.py             ← RawTweet, Complaint, Cluster, Action tables
│   │   └── schemas.py            ← Pydantic request/response shapes
│   │
│   ├── ingestion/
│   │   ├── mock_feed.py          ← replays tweets.json one by one (legacy)
│   │   ├── db_feed.py            ← reads unprocessed tweets from SQLite (current)
│   │   ├── normaliser.py         ← cleans raw tweet text
│   │   ├── x_listener.py        ← real tweepy stream (post-hackathon)
│   │   └── tweets.json           ← 63 mock #complaints_gov posts
│   │
│   ├── pipeline/
│   │   ├── classifier.py         ← BART zero-shot text classification
│   │   ├── ner.py                ← spaCy NER + Indian locality gazetteer
│   │   ├── urgency.py            ← keyword rules + retweet social signal boost
│   │   ├── clusterer.py          ← sentence-transformers cosine similarity
│   │   ├── summariser.py         ← Groq API llama summarisation
│   │   ├── router.py             ← category + city → department mapping
│   │   └── main.py               ← orchestrates all 6 stages in sequence
│   │
│   ├── api/
│   │   ├── clusters.py           ← GET /clusters, GET /clusters/{id}
│   │   ├── actions.py            ← PUT /clusters/{id}/status
│   │   └── stats.py              ← GET /stats
│   │
│   ├── cache/
│   │   └── summaries.json        ← cached Groq summaries (API fallback)
│   │
│   └── tests/
│       ├── test_classifier.py
│       ├── test_ner.py
│       ├── test_urgency.py
│       └── test_clusterer.py
│
├── frontend/
│   └── src/
│       ├── api/
│       │   └── client.js         ← axios instance + all API calls
│       ├── components/
│       │   ├── ClusterCard.jsx   ← ranked card with expand panel
│       │   ├── Sidebar.jsx       ← dept + location filters
│       │   ├── StatsBar.jsx      ← totals, urgency counts, live ticker
│       │   ├── DemoTrigger.jsx   ← fires pre-canned tweet for judges
│       │   └── DeptBadge.jsx     ← coloured department pill
│       ├── pages/
│       │   └── Dashboard.jsx     ← main page, wires all components
│       └── hooks/
│           ├── useClusters.js    ← polls GET /clusters every 5s
│           └── useStats.js       ← polls GET /stats every 10s
│
├── .gitignore
└── README.md
```

---

## What Each File Does

### Backend Core
| File | Purpose |
|------|---------|
| `main.py` | FastAPI app. Wires CORS, loads AI models at startup, starts background ingestion thread, includes all API routers |
| `seed_db.py` | Run once before server start. Reads tweets.json and inserts all tweets into raw_tweets table with processed=False |

### Database Layer
| File | Purpose |
|------|---------|
| `database.py` | Creates SQLAlchemy engine connected to issuerouter.db. Exports engine, SessionLocal, Base |
| `models.py` | Defines 4 SQLAlchemy tables: RawTweet, Complaint, Cluster, Action |
| `schemas.py` | Pydantic models for API request/response validation |

### Ingestion Layer
| File | Purpose |
|------|---------|
| `db_feed.py` | Background thread. Queries raw_tweets for unprocessed rows, calls pipeline, marks rows processed. Runs every 8s |
| `normaliser.py` | Strips @mentions, hashtags, URLs, extra whitespace from raw tweet text |
| `x_listener.py` | Post-hackathon real X stream via tweepy. Same callback interface — one line swap |
| `tweets.json` | 63 pre-collected mock complaints across 16 issue types, 5 cities, varied urgency levels |

### NLP Pipeline
| File | Purpose |
|------|---------|
| `classifier.py` | BART zero-shot. classify(text) → (category, confidence). 7 categories. ~400ms per call |
| `ner.py` | spaCy en_core_web_sm + custom EntityRuler with 30+ Indian localities. extract_entities(text) → {location, department_mentioned, date} |
| `urgency.py` | score_urgency(text, retweets) → critical/high/medium/low. Keyword dict + retweet boost |
| `router.py` | route_department(category, location) → department string. City-aware overrides |
| `clusterer.py` | all-MiniLM-L6-v2 embeddings. Cosine similarity at 0.70 threshold. Running centroid average |
| `summariser.py` | Groq llama-3.1-8b-instant. One-line officer briefs. Caches results. Rule-based fallback |
| `main.py` | process_post(raw_tweet) → calls all 6 stages → returns ProcessedPost dict |

---

## Database Schema Summary

### raw_tweets table
Stores incoming tweets before processing. `processed` flag is the job queue mechanism.

### complaints table
One row per processed tweet. Links to its parent cluster via cluster_id FK.

### clusters table
One row per distinct issue group. `centroid_embedding` is the average of all member tweet embeddings stored as JSON string. `priority_score` drives dashboard ranking.

### actions table
Log of officer actions (assign/resolve/escalate) with timestamps.

---

## Priority Score Formula

```
priority_score = (complaint_count × 1.0) + (rt_reach × 0.3) + urgency_weight

urgency_weight: critical=200, high=100, medium=40, low=10
```

---

## API Endpoints

```
GET  /clusters              → ranked cluster list, filterable by dept/urgency/status
GET  /clusters/{id}         → full cluster detail + sample tweets
PUT  /clusters/{id}/status  → assign / resolve / escalate
GET  /stats                 → totals by urgency and department
```

---

## Team Roles

| Member | Role | Owns |
|--------|------|------|
| Om (PiUnknown) | Repo owner, NLP pipeline | pipeline/, ingestion/, seed_db.py |
| Anuj-135 | Backend, DB, API | db/, api/, main.py |
| Averagestudent123 | Frontend dashboard | frontend/src/ |
| Parth Singhal | Seed data, testing, integration | tweets.json, tests/ |

---

## How to Run Locally

```powershell
# Backend — run once per machine
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env       # add GROQ_API_KEY

# Every fresh run
Remove-Item issuerouter.db -Force
python seed_db.py
uvicorn main:app --reload --port 8000

# Frontend — separate terminal
cd frontend
npm install
npm run dev                # http://localhost:5173
```

---

## Environment Variables (.env)

```
GROQ_API_KEY=gsk_...
DATABASE_URL=sqlite:///./issuerouter.db
MOCK_FEED_INTERVAL=8
CLUSTER_SIMILARITY_THRESHOLD=0.70
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui, Recharts, axios |
| Backend | Python 3.13, FastAPI, uvicorn, SQLAlchemy, Pydantic v2 |
| Database | SQLite via SQLAlchemy ORM |
| Classification | facebook/bart-large-mnli (HuggingFace zero-shot) |
| NER | spaCy en_core_web_sm + custom EntityRuler gazetteer |
| Clustering | sentence-transformers/all-MiniLM-L6-v2 |
| Urgency | Hybrid keyword rules + retweet social signal boost |
| Summarisation | Groq API — llama-3.1-8b-instant (free tier) |
| Ingestion | DB feed pattern — raw_tweets table with processed flag |

---

> *"AI's job here is not to solve the problem — it's to make sure the right person sees it first."*

*© 2026 Team Convergence. IssueRouter. Built at HNC 3.0.*