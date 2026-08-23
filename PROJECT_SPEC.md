# IssueRouter — Engineering Specifications & Guidelines

This document details the architectural rules, coding standards, API contracts, and engineering boundaries of the IssueRouter project. Any AI agent or developer extending this codebase MUST adhere strictly to these principles.

---

## 1. Architectural Layers & Boundaries

The codebase operates under a strict three-tier architecture. Files inside one layer must never bypass intermediate layers to access resources.

```
       [ React Frontend ]
               │ (REST API via Axios client)
               ▼
       [ FastAPI Backend ]
       ├── API Routes (`api/`)
       └── DB Engine/Models (`db/`)
               │ (SQLAlchemy ORM)
               ▼
       [ SQLite Database ]
         (raw_tweets table)
               ▲
               │ (Decoupled Background Daemon)
       [ Ingestion / Ingest Worker ]
       └── db_feed.py
               │ (Orchestrator main.py)
               ▼
       [ NLP Pipeline (`pipeline/`) ]
```

### Ingestion Layer (`backend/ingestion/`)
* **Job**: Periodically check for raw data and stage it in the database.
* **Rule**: `db_feed.py` runs as an asynchronous background thread initiated at FastAPI startup. It queries the `raw_tweets` table for rows where `processed == False`. It calls the NLP pipeline orchestrator (`pipeline/main.py`) to process the text, writes the output to the database tables, and marks `processed = True`. It **must never** communicate directly with the React frontend or API routers.

### NLP Pipeline Layer (`backend/pipeline/`)
* **Job**: Triage text in a pure, stateless sequence of function calls.
* **Rule**: It does **not** write to or read from the SQLite database. It is called by the ingestion worker, receives a raw tweet payload, processes it sequentially through the 6 stages, and returns a structured dictionary output.

### API Layer (`backend/api/`)
* **Job**: Serve data REST endpoints for the client dashboard.
* **Rule**: Routers must only query the database models via SQLAlchemy sessions and return Pydantic models (`db/schemas.py`). They must be decoupled from the ingestion worker and the NLP pipeline.

---

## 2. Database Schema Specifications

### `raw_tweets` Table
* **Fields**: `id` (PK, string), `username` (string), `text` (string), `likes` (int), `retweets` (int), `created_at` (string), `processed` (bool).
* **Role**: Ingestion job queue.

### `complaints` Table
* **Fields**: `id` (PK, int), `tweet_id` (string), `username` (string), `text` (string), `category` (string), `urgency` (string), `location` (string), `department` (string), `created_at` (string), `cluster_id` (FK to clusters table).
* **Role**: Processed single complaint entries.

### `clusters` Table
* **Fields**: `id` (PK, int), `centroid_embedding` (string, JSON list of float values representing vector), `department` (string), `location` (string), `summary` (string), `priority_score` (float), `status` (string: "unassigned", "assigned", "resolved", "escalated"), `updated_at` (string).
* **Role**: Grouped semantic issues.

### `actions` Table
* **Fields**: `id` (PK, int), `cluster_id` (FK), `action_type` (string), `officer_name` (string), `timestamp` (string).
* **Role**: Operational log for tracking actions.

---

## 3. Strict Coding Conventions

### 1. Data Type Validation
* All API endpoints must use **Pydantic schemas** (`schemas.py`) for body payload parsing and response validation. Raw dictionaries must never be returned from FastAPI endpoints.

### 2. Dependency Management
* Do not add ad-hoc libraries. Any library addition must be logged in `backend/requirements.txt` (Python) or `frontend/package.json` (Node.js) and verified locally.

### 3. API Contract Limits
* The REST endpoints must strictly return data conforming to the contract:
  * `GET /clusters` → returns `{ "clusters": [...], "total": int }`
  * `GET /stats` → returns `{ "total_complaints": int, "by_urgency": {...}, "by_dept": {...}, "last_ingested": string }`
  * `PUT /clusters/{id}/status` → receives `{ "status": string }`

### 4. Frontend State Syncing
* The frontend must **only** communicate with the backend using the base Axios client (`frontend/src/api/client.js`).
* Real-time updates must rely on client-side polling hooks (`useClusters` at 5s and `useStats` at 10s). WebSockets are prohibited to maintain server simplicity.
