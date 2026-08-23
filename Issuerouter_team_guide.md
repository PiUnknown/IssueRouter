# IssueRouter — Team Convergence
## Complete Folder Structure + GitHub Collaboration Guide

---

## 1. REPOSITORY STRUCTURE

One monorepo. Two root folders. Zero confusion.

```
issuerouter/
│
├── backend/                        ← Dev 1 + Dev 2 own this
│   ├── main.py                     ← FastAPI app entry point + startup wiring
│   ├── seed_db.py                  ← seeds SQLite database (raw_tweets table)
│   ├── requirements.txt            ← Python dependencies
│   ├── .env                      ← API keys (never commit this)
│   ├── .env.example              ← template env configurations
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── actions.py              ← PUT /clusters/{id}/status (assign/resolve)
│   │   ├── clusters.py             ← GET /clusters, GET /clusters/{id}
│   │   └── stats.py                ← GET /stats
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py             ← SQLAlchemy database engine + session setup
│   │   ├── models.py               ← RawTweet, Complaint, Cluster, Action tables
│   │   └── schemas.py              ← Pydantic schemas for API request validation
│   │
│   ├── ingestion/
│   │   ├── __init__.py
│   │   ├── db_feed.py              ← background worker parsing raw_tweets into DB
│   │   ├── mock_feed.py            ← legacy mock tweet feeder
│   │   ├── normaliser.py           ← text normalisation routines
│   │   ├── tweets.json             ← 63 pre-compiled mock tweets
│   │   └── x_listener.py          ← Tweepy setup for real-time X listener
│   │
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── classifier.py           ← BART zero-shot classification
│   │   ├── clusterer.py            ← SentenceTransformers-based clusterer
│   │   ├── main.py                 ← orchestrates 6 pipeline stages in sequence
│   │   ├── ner.py                  ← spaCy model + locality EntityRuler
│   │   ├── router.py               ← routes issues to departments
│   │   ├── summariser.py           ← Groq llama-3.1-8b-instant summarizer
│   │   └── urgency.py              ← urgency scoring logic
│   │
│   ├── output/
│   │   └── processed_results.json  ← generated results cache
│   │
│   ├── cache/
│   │   └── summaries.json          ← local Llama summary cache fallback
│   │
│   ├── scripts/                    ← backend scripts
│   │   ├── pipeline_standalone.py
│   │   ├── seed.py
│   │   └── seed_db.py
│   │
│   └── tests/
│       └── test_pipeline.py        ← consolidated test suite
│
├── frontend/                       ← Dev 3 + Dev 4 own this
│   ├── index.html                  ← React frontend entry point
│   ├── package.json                ← frontend node dependencies
│   ├── eslint.config.js
│   ├── tailwind.config.js          ← Tailwind CSS setup
│   ├── vite.config.js              ← Vite config (with proxy settings)
│   │
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   │
│   └── src/
│       ├── App.css
│       ├── App.jsx                 ← root React component (routes setup)
│       ├── index.css
│       ├── main.jsx
│       │
│       ├── api/
│       │   ├── client.js           ← Axios API instance base
│       │   ├── clusters.js         ← API functions for fetching clusters
│       │   └── stats.js            ← API functions for stats
│       │
│       ├── assets/
│       │   ├── IssueRouter.png
│       │   ├── index.js
│       │   └── issuerouter-logo.svg
│       │
│       ├── components/
│       │   └── Dashboard.jsx       ← main page, wires all components
│       │
│       └── hooks/
│           ├── useClusters.js      ← polls GET /clusters every 5s
│           └── useStats.js         ← polls GET /stats every 10s
│
├── .gitignore
├── README.md
└── CONTRIBUTING.md
```

---

## 2. TEAM ROLE ASSIGNMENT

There are six developers working on five dedicated branches:

| Member | Focus | Owns | Target Branch |
|--------|-------|------|---------------|
| Dev 1  | Backend Core & Server | FastAPI server, startup scripts | `backend` |
| Dev 2  | NLP pipeline | BART classification, spaCy NER, routing rules | `nlp-pipeline` |
| Dev 3  | Frontend | Dashboard, pages, layouts, Axios client | `frontend` |
| Dev 4  | Database & Seeding | SQLite database models, schemas, seed script | `database` |
| Dev 5  | Testing & Integration | Integration scripts, dashboard components testing | `backend` / `frontend` |
| Dev 6  | Docs & Release | README, team guide, documentation | `document-update` |

---

## 3. GITHUB SETUP — DO THIS FIRST (30 min, all together)

### 3.1 One person creates the repo
```bash
# On GitHub.com:
# New repo → name: issuerouter → Private → NO README (you'll push one)
# Add all 4 members as Collaborators under Settings → Collaborators
```

### 3.2 Everyone clones and sets up
```bash
git clone https://github.com/team-convergence/issuerouter.git
cd issuerouter
```

### 3.3 Create the folder skeleton (Dev 1 does this, pushes to main)
```bash
mkdir -p backend/{db,ingestion,pipeline,api,cache,tests,scripts,output}
mkdir -p frontend/src/{api,assets,components/layout,components/ui,context,data,hooks,pages}
touch backend/{main.py,requirements.txt,seed_db.py,.env.example}
touch backend/db/{__init__.py,database.py,models.py,schemas.py}
touch backend/ingestion/{__init__.py,db_feed.py,mock_feed.py,x_listener.py,normaliser.py,tweets.json}
touch backend/pipeline/{__init__.py,classifier.py,ner.py,urgency.py,clusterer.py,summariser.py,router.py,main.py}
touch backend/api/{__init__.py,clusters.py,actions.py,stats.py}
touch backend/tests/test_pipeline.py
touch .gitignore README.md LICENSE

git add .
git commit -m "chore: initialise project skeleton"
git push origin main
```

### 3.4 Branch protection (repo owner does this)
Since all changes are to be done in five persistent branches (`frontend`, `backend`, `database`, `nlp-pipeline`, and `document-update`), the `main` branch functions as the single source of truth combining the whole project.

**Rule:** Nobody commits directly to `main`. Every developer pushes to their respective persistent work branch. Merging into `main` only occurs after the changes are verified to be bug-free and working as expected.

---

## 4. BRANCHING STRATEGY

Instead of creating multiple temporary feature branches, the team works out of **five persistent development branches**:

1. **`frontend`** — For all dashboard React components, UI edits, pages, assets, and api/hooks client-side updates.
2. **`backend`** — For FastAPI server, startup rules, routing endpoints, output caching, and app configurations.
3. **`database`** — For SQLAlchemy tables, database engines, schemas, and seeding scripts.
4. **`nlp-pipeline`** — For classifiers, clusterers, spaCy models, and Groq summarization services.
5. **`document-update`** — For `README.md`, `Issuerouter_team_guide.md`, and any text/diagram document updates.

### Daily Workflow

Every team member follows these steps:

#### Step 1: Sync Your Local Work Branch
Switch to your respective branch and pull the latest changes:
```bash
# Example for a frontend developer:
git checkout frontend
git pull origin frontend
```

#### Step 2: Make Changes and Test Locally
Write your code, make sure it runs correctly, and run tests.

#### Step 3: Commit and Push to Your Respective Branch
```bash
git add frontend/src/components/ui/ClusterCard.jsx
git commit -m "feat(frontend): update card styling and layout"
git push origin frontend
```

#### Step 4: Merging into the Main Branch (Default)
When a branch has verified, working changes that need to be unified:
1. Ensure the code has been successfully reviewed.
2. Sync `main` locally, merge the work branch into it, and push to remote `main`:
```bash
git checkout main
git pull origin main
git merge frontend
git push origin main
```
```

---

## 5. COMMIT MESSAGE FORMAT

Use this format. It makes the git log readable during a hectic hackathon.

```
{type}({scope}): {short description}

Types:
  feat     → new feature
  fix      → bug fix
  chore    → setup, config, deps
  test     → adding tests
  docs     → README, comments
  refactor → restructure without behaviour change

Examples:
  feat(pipeline): add spaCy NER with custom EntityRuler for Indian cities
  feat(api): add GET /clusters endpoint with dept filter
  feat(frontend): implement ClusterCard expand panel
  fix(ingestion): prevent duplicate tweet_id on mock feed loop
  chore(deps): add sentence-transformers to requirements.txt
  test(pipeline): add unit tests for urgency scorer
```

---

## 6. PULL REQUEST TEMPLATE

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## What does this PR do?
<!-- One sentence -->

## How to test it
<!-- Steps to verify it works -->

## Checklist
- [ ] Code runs without errors
- [ ] No secrets or .env files committed
- [ ] Relevant tests added or updated
- [ ] API contract unchanged (or discussed with team)
```

---

## 7. THE API CONTRACT (agree on this in Hour 1)

This is the document Dev 1 writes and everyone else codes against.
Save it as `README.md` immediately. Prevents all integration conflicts.

```
GET  /clusters
     Query params: dept, urgency, status, limit, offset
     Returns: { clusters: [...], total: int }

GET  /clusters/{id}
     Returns: full cluster + sample_tweets array

PUT  /clusters/{id}/status
     Body: { "status": "assigned" | "resolved" | "escalated" }
     Returns: { success: true }

GET  /stats
     Returns: {
       total_complaints: int,
       by_urgency: { critical, high, medium, low },
       by_dept: { PWD, "Jal Board", MCD, ... },
       last_ingested: ISO timestamp
     }
```

**Rule:** If any endpoint shape needs to change, the person who needs the change
messages the group chat BEFORE changing. Never silently break someone else's code.

---

## 8. THE .gitignore

```gitignore
# Python
__pycache__/
*.pyc
*.pyo
.venv/
venv/
*.egg-info/

# Environment
.env
*.env

# Database
*.db
*.sqlite
*.sqlite3

# ML model cache (too large for git)
.cache/
~/.cache/huggingface/

# Node
node_modules/
dist/
.DS_Store

# IDE
.vscode/
.idea/
*.swp
```

**Critical:** `.env` is in `.gitignore`. Your `ANTHROPIC_API_KEY` never touches GitHub.
Share keys via your group chat only.

---

## 9. ENVIRONMENT FILES

### backend/.env.example (commit this)
```
ANTHROPIC_API_KEY=your_key_here
DATABASE_URL=sqlite:///./issuerouter.db
MOCK_FEED_INTERVAL=8
CLUSTER_SIMILARITY_THRESHOLD=0.82
```

### backend/.env (never commit — each person creates their own)
```
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=sqlite:///./issuerouter.db
MOCK_FEED_INTERVAL=8
CLUSTER_SIMILARITY_THRESHOLD=0.82
```

### frontend/.env.example (commit this)
```
VITE_API_URL=http://localhost:8000
```

---

## 10. PARALLEL BUILD SCHEDULE

### Hour 0–1: Foundation (all members)
| Who | Task |
|-----|------|
| Dev 1 | Create repo, push skeleton, set branch protection |
| All | Clone repo, set up local Python venv + Node env |
| Dev 1 | Write `db/models.py` + `db/schemas.py` |
| All | Agree on API contract, add to README |

**Sync checkpoint:** Everyone must have the repo running locally before splitting.

---

### Hour 1–6: Parallel build (split by role)

**Dev 1 — Backend**
```
Hour 1–2  → db/database.py, db/models.py, db/schemas.py
Hour 2–4  → api/clusters.py, api/actions.py, api/stats.py
Hour 4–5  → main.py (wire ingestion thread at startup)
Hour 5–6  → test all endpoints via FastAPI /docs
```

**Dev 2 — Pipeline**
```
Hour 1–2  → pipeline/classifier.py (BART zero-shot, test solo)
Hour 2–3  → pipeline/ner.py (spaCy + gazetteer)
Hour 3–4  → pipeline/urgency.py + pipeline/router.py
Hour 4–5  → pipeline/clusterer.py (sentence-transformers)
Hour 5–6  → pipeline/summariser.py (Groq llama-3.1-8b-instant + cache fallback)
            pipeline/main.py (wire all modules in sequence)
```

**Dev 3 — Frontend**
```
Hour 1–2  → Vite setup, Tailwind, folder structure
Hour 2–3  → api/client.js (axios, all endpoints stubbed)
Hour 3–5  → components/ui/ClusterCard.jsx (with expand panel)
Hour 5–6  → components/layout/Sidebar.jsx + components/ui/FilterBar.jsx
```

**Dev 4 — Data + Integration**
```
Hour 1–2  → Generate tweets.json (60-80 entries via GPT-4)
Hour 2–3  → ingestion/mock_feed.py + ingestion/normaliser.py
Hour 3–4  → seed_db.py (seeds SQLite raw tweets)
Hour 4–5  → cache/summaries.json (pre-generate all demo summaries)
Hour 5–6  → tests/test_pipeline.py
```

---

### Hour 6–8: Integration (Dev 1 + Dev 4 lead)
```
- Dev 1 merges all backend PRs into main
- Dev 4 runs seed_db.py and confirms data flows end-to-end
- Dev 3 wires axios calls against live backend
- Fix CORS, fix payload mismatches
- Run full demo flow once
```

**Sync checkpoint:** Every feature merged. Dashboard shows live data.

---

### Hour 8–10: Polish + demo prep (all members)
```
- Dev 3: animate card entrance, fix any UI glitches
- Dev 4: prepare 5 trigger tweets, test DemoTrigger button
- Dev 2: tune clustering threshold on seed data
- Dev 1: deploy to Railway + Vercel (or confirm localhost works)
- All: run the demo script 3× out loud
```

---

## 11. CONFLICT PREVENTION RULES

These 6 rules prevent 90% of merge conflicts when working with persistent branches:

**Rule 1:** Push changes only to the branch corresponding to your work (e.g. backend files to the `backend` branch, database files to the `database` branch, docs to `document-update`).

**Rule 2:** Only Dev 4 modifies database files (`backend/db/`). Other developers request Dev 4 to make database schema edits.

**Rule 3:** Regularly fetch and sync your work branch with the latest changes from `main` to avoid large divergence:
```bash
git checkout main && git pull origin main
git checkout frontend && git merge main
```

**Rule 4:** Before merging any work branch into `main`, confirm locally that all tests pass and there are no integration conflicts.

**Rule 5:** Never force push (`git push --force`) to any of the five shared branches or the `main` branch.

**Rule 6:** For documentation updates like the README or this guide, always commit and push to `document-update` first. Merge into `main` only after confirmation.

---

## 12. DAY-OF-DEMO CHECKLIST

Run this the morning of the demo, in order:

```bash
# Terminal 1 — Backend
cd backend
source venv/bin/activate
python seed_db.py          # ← ALWAYS do this first. Seeds raw tweets.
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev             # runs on localhost:5173
```

Then:
- [ ] Open dashboard in browser — confirm 20+ cluster cards visible
- [ ] Confirm mock feed ticker is updating (new complaint every 8s)
- [ ] Manually trigger gas leak demo tweet — confirm #1 PRIORITY card appears
- [ ] Click Assign — confirm status updates
- [ ] Filter by PWD — confirm only road clusters remain
- [ ] Check all cluster expand panels load correctly
- [ ] Confirm Groq summaries are populated (or cache is serving)
- [ ] **Do NOT restart the server after this point**

---

## 13. QUICK COMMANDS REFERENCE

```bash
# Backend setup (run once)
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env              # then add your GROQ_API_KEY

# Run backend
uvicorn main:app --reload --port 8000

# Seed database
python seed_db.py

# Frontend setup (run once)
cd frontend
npm install
cp .env.example .env

# Run frontend
npm run dev

# Git: Syncing your work branch (e.g. nlp-pipeline)
git checkout nlp-pipeline
git pull origin nlp-pipeline

# Git: Syncing with latest main changes
git checkout main && git pull origin main
git checkout nlp-pipeline && git merge main

# Git: Saving and pushing work
git add -p
git commit -m "feat(pipeline): description"
git push origin nlp-pipeline

# Git: Merging a verified branch to main
git checkout main
git pull origin main
git merge nlp-pipeline
git push origin main
```

---

*Team Convergence. IssueRouter. Noise to action.*