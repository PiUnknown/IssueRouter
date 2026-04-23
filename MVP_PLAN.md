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
- **Summarization** standardizes messy citizen language into actionable summaries
- This 4-5 step pipeline cannot be solved with rules alone—it requires ML

---

## 2. MVP Scope (Hackathon-Optimized)

**What IS Built (Scope):**
1. ✅ Real-time X post ingestion via public API (search for `#complaints_gov` hashtag)
2. ✅ ML pipeline: 
   - Multi-class text classification (5–7 categories: Infrastructure, Water, Sanitation, Health, Safety, Other)
   - NER for location extraction
   - Urgency scoring (Low/Medium/High)
   - LLM-based summary generation
3. ✅ SQLite database storing complaints with metadata
4. ✅ React admin dashboard showing all triage results
5. ✅ Department routing suggestion (deterministic rule-based)
6. ✅ Complaint detail view with original X post link

**What is EXCLUDED (Out of Scope):**
- ❌ Closed-loop feedback (citizens don't see status updates in this MVP)
- ❌ Multi-language support
- ❌ Real email routing to departments (show suggestions only)
- ❌ User authentication (public dashboard)
- ❌ Fine-tuned models (use pre-trained only)
- ❌ Mobile app

**The "Wow Factor" Demo Moment:**
Show judges a real X post like *"Broken streetlight on Main St, happens every night, nobody fixes it!"*
→ System instantly outputs:
- **Category:** Infrastructure | **Urgency:** High | **Department:** PWD | **Location:** Main St
- Clean summary shown in dashboard
- Original X post linked
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
4. Scheduler (runs every 5 min): Query X API for latest #complaints_gov posts
5. For each new post:
   a. Extract text, author, timestamp, media (if any)
   b. Run through ML pipeline:
      - Classification model → "Infrastructure"
      - NER model → Extract "Area 51"
      - Urgency model → "High" (keywords: "ASAP", "blocking", "traffic")
      - LLM summarization → "Dangerous pothole on main road, Area 51"
   c. Rule-based routing → "Public Works Department"
   d. Store in DB with confidence scores
6. Dashboard auto-refreshes (WebSocket or polling)
```

### Admin Side (Government):
```
7. Dashboard loads → See real-time list of complaints
8. Click any complaint → See:
   - Full X post (embedded)
   - Extracted metadata (category, urgency, location, dept)
   - Suggested summary
   - Confidence score
9. Option to:
   - Mark as "Forwarded"
   - View complaint timeline
   - Filter by urgency/category
```

---

## 4. System Architecture (Practical, Not Theoretical)

```
┌─────────────────────────────────────────────────────────────┐
│                    X PUBLIC API                               │
│           (Search posts with #complaints_gov)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI / Node.js)                    │
│                                                              │
│  1. Scheduler (APScheduler / node-cron)                     │
│     └─ Fetches new X posts every 5 min                      │
│                                                              │
│  2. ML Pipeline Runner                                      │
│     ├─ Classification (scikit-learn / Hugging Face)        │
│     ├─ NER (spaCy or Hugging Face)                         │
│     ├─ Urgency Scorer (hybrid: rules + ML)                 │
│     └─ LLM Summarizer (OpenAI API or open-source)          │
│                                                              │
│  3. Rooting Logic (Deterministic Rules)                     │
│     └─ category → department mapping                        │
│                                                              │
│  4. REST API Endpoints                                      │
│     ├─ GET /api/complaints (all, filtered)                │
│     ├─ GET /api/complaints/:id (detail)                   │
│     ├─ POST /api/complaints/:id/status (mark processed)   │
│     └─ GET /api/stats (dashboard metrics)                 │
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
        │ - department         │
        │ - summary            │
        │ - confidence_score   │
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
   └─────────────┘   └──────────────────┘
```

**Key Flows:**
1. **Ingestion:** X API → FastAPI endpoint → Store raw post in DB
2. **Processing:** Background job runs ML pipeline → Update complaint record with metadata
3. **Display:** React fetches from API → Dashboard renders complaint list with filtering
4. **Live Updates:** WebSocket pushes new complaints to open dashboards in real-time

---

## 5. AI/ML Design (Very Concrete)

### A. Text Classification (Category Assignment)

**Problem:** Classify "Potholes on Main Street" → Infrastructure

**Model Choice:**
- **Library:** scikit-learn + TfidfVectorizer + LogisticRegression
- **Why:** Lightweight, no GPU needed, ~90% accuracy for this domain
- **Alternative:** Hugging Face DistilBERT (if you want 95%+ accuracy, slightly slower)

**Implementation:**
```python
# Training (mock data for MVP)
categories = {
    "Infrastructure": ["pothole", "street", "pavement", "road", "bridge", ...],
    "Water": ["water", "tap", "leak", "pipe", "supply", ...],
    "Health": ["clinic", "hospital", "disease", "sick", ...],
    # ... etc (5-7 categories)
}

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

vectorizer = TfidfVectorizer(max_features=500)
classifier = LogisticRegression()

# Fit on training data
# At runtime: predict(complaint_text) → category + confidence
```

**Confidence Threshold:** Only show category if confidence > 0.6; otherwise flag as "Unclear"

---

### B. Named Entity Recognition (Location Extraction)

**Problem:** Extract "Main Street" or "Sector 5" from "Potholes on Main Street near mosque"

**Model Choice:**
- **Library:** spaCy (pre-trained `en_core_web_sm`) + custom training
- **Why:** Fast, accurate for locations, zero-setup for basic use

**Implementation:**
```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("Potholes on Main Street")
locations = [ent.text for ent in doc.ents if ent.label_ == "GPE"]
# Output: ["Main Street"]
```

**Limitation:** spaCy works for named entities; for informal locations like "near the mosque" you need:
- **Fallback Rule:** Extract nouns (using NLTK POS tagging)
- **Hybrid:** Combine spaCy NER + regex for street patterns

---

### C. Summarization (Standardized Citizen Voice)

**Problem:** Convert messy text into clean, actionable summary

**Model Choice:**
- **Primary:** OpenAI API (if API key available) — 30 seconds, high quality
- **Fallback:** Hugging Face Pegasus summarization (local, slower, but free)
- **Lightweight Fallback:** Extractive summarization (pick top 2 sentences)

**Implementation:**
```python
# Option 1: OpenAI (hackathon-friendly)
import openai
openai.api_key = YOUR_KEY
response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[{
        "role": "system",
        "content": "Summarize citizen complaints in 1 sentence, include location and issue."
    }, {
        "role": "user",
        "content": complaint_text
    }]
)
summary = response['choices'][0]['message']['content']

# Option 2: Hugging Face (free)
from transformers import pipeline
summarizer = pipeline("summarization")
summary = summarizer(complaint_text, max_length=50)[0]['summary_text']
```

**Prompt Engineering (Critical):**
```
System: "You are a government intake clerk. Convert citizen complaints into clear, structured summaries. 
Focus on: issue type, location, impact. Keep to 1 sentence. Be professional."
```

---

### D. Urgency Detection (Rules + Light ML)

**Problem:** Classify "Broken streetlight on Main St, happens every night, nobody fixes it!" as High urgency

**Approach: Hybrid (Rule + ML)**

**Rules (70% of accuracy):**
```python
HIGH_KEYWORDS = {"fatal", "death", "injury", "emergency", "asap", "danger", "critical", 
                 "blocked", "flooding", "accident", "immediate"}
MEDIUM_KEYWORDS = {"broken", "issue", "problem", "not working", "needed"}

def urgency_from_rules(text):
    text_lower = text.lower()
    if any(kw in text_lower for kw in HIGH_KEYWORDS):
        return "High"
    elif any(kw in text_lower for kw in MEDIUM_KEYWORDS):
        return "Medium"
    return "Low"
```

**ML Boost (if time permits):**
Train a simple logistic regression on labeled complaints (collect during dev) to refine confidence.

**Final Score:**
```python
rule_urgency = urgency_from_rules(text)
ml_confidence = ml_model.predict_proba(text)[0]

# If ML confident (>0.75), use ML; else use rules
final_urgency = ml_urgency if ml_confidence > 0.75 else rule_urgency
```

---

## 6. Data Strategy

### Data Requirements:

**For Training (Classified Complaints):**
- ~50–100 manually labeled complaints (category, location, urgency)
- Format: `[{"text": "...", "category": "...", "location": "...", "urgency": "..."}]`

**For Inference (Real X Posts):**
- Raw X post data: `{"id", "text", "author", "created_at", "url"}`

### Mock Data Generation (For Hackathon):

**Seed Data (Example):**
```json
[
  {
    "text": "Pothole on Main Street near mosque, traffic accident risk!",
    "category": "Infrastructure",
    "location": "Main Street",
    "urgency": "High",
    "department": "Public Works"
  },
  {
    "text": "Water tap not working in Sector 5 for 3 days",
    "category": "Water",
    "location": "Sector 5",
    "urgency": "Medium",
    "department": "Water Works"
  },
  {
    "text": "Streetlight broken outside school",
    "category": "Infrastructure",
    "location": "School area",
    "urgency": "High",
    "department": "Public Works"
  }
]
```

**Synthetic Data Pipeline:**
```python
# Use templates to quickly generate training data
templates = {
    "Infrastructure": [
        "Pothole on {location} causing accidents",
        "Broken {asset} at {location}",
        "Road damaged on {location}"
    ],
    # ... etc
}

locations = ["Main St", "Sector 5", "Downtown", "Market Road", ...]
def generate_training_data(n=100):
    data = []
    for _ in range(n):
        category = random.choice(list(templates.keys()))
        template = random.choice(templates[category])
        location = random.choice(locations)
        text = template.format(location=location)
        data.append({
            "text": text,
            "category": category,
            "location": location,
            "urgency": "High" if "accident" in text else "Medium"
        })
    return data
```

---

## 7. Tech Stack (Specific, Opinionated)

| Component | Choice | Why |
|-----------|--------|-----|
| **Backend Framework** | FastAPI (Python) | Fast, async, built-in API docs, ideal for ML pipelines |
| **ML/NLP Stack** | scikit-learn + spaCy + Hugging Face transformers | Lightweight, no GPU needed, production-ready |
| **LLM (Summarization)** | OpenAI API (GPT-3.5-turbo) or free: Hugging Face Pegasus | OpenAI = quality; Hugging Face = free but slower |
| **Database** | SQLite (MVP) → PostgreSQL (production) | SQLite: zero setup for hackathon; scales to 1M records |
| **Frontend** | React + TypeScript + SWR | Fast iteration, real-time data fetching with SWR |
| **Styling** | Tailwind CSS | Rapid prototyping, pre-built components |
| **X API Integration** | tweepy or x-python library | Standard, well-documented |
| **Job Scheduling** | APScheduler (Python) | Lightweight, runs background jobs for post ingestion |
| **Real-Time Updates** | WebSocket (python-socketio) | Live dashboard updates without refresh |
| **Hosting (Optional)** | Vercel (frontend) + Railway/Render (backend) | Free tier, simple deploy, works for hackathon |

**Why NOT:**
- ❌ Django: Too heavy for MVP
- ❌ TensorFlow/PyTorch: Overkill for lightweight models
- ❌ GraphQL: REST is simpler and faster to build
- ❌ MongoDB: SQL is better for structured complaints data

---

## 8. Step-by-Step Build Plan

### Phase 1: Foundation (Hours 1–4) — **Can be done in parallel by 2 people**

**Task 1a (Backend Dev):** Set up FastAPI, SQLite schema, and X API integration
- Create FastAPI project structure
- Define SQLite schema (complaints table with fields: id, x_post_id, text, category, location, urgency, summary, department, created_at)
- Write X API client to fetch #complaints_gov posts
- Create endpoint: `GET /api/complaints` (returns all complaints)

**Task 1b (Frontend Dev):** Create React dashboard skeleton
- Set up React + Tailwind
- Build layout: Header + Sidebar + Main complaint list
- Create complaint card component (mock data)
- Set up routing (list view, detail view)

**Deliverable:** Backend returns mock complaints; frontend displays them.

---

### Phase 2: ML Pipeline (Hours 5–8) — **Serial, backend-focused**

**Task 2:** Train and integrate ML models
- Collect/generate 50–100 training samples (template-based)
- Train scikit-learn text classifier → save model pickle
- Train spaCy NER (or use pre-trained)
- Set up summarization endpoint (OpenAI API or Hugging Face)
- Create `/api/process` endpoint that takes raw text → returns classified/extracted output

**Deliverable:** Hit `/api/process` with raw X post text → get back structured JSON (category, location, urgency, summary)

---

### Phase 3: Integration (Hours 9–12) — **Can be done in parallel**

**Task 3a (Backend):** Wire ML pipeline to ingestion
- Modify X ingestion job to call `/api/process` for each post
- Store ML results in DB
- Add filtering endpoints: `/api/complaints?category=Infrastructure&urgency=High`

**Task 3b (Frontend):** Build interactive dashboard
- Display complaints with real-time updates (WebSocket or polling)
- Add filters (category, urgency, department)
- Build detail view: show original X post + extracted metadata
- Add status buttons (mark as "Forwarded")

**Deliverable:** End-to-end flow: X post → system processes → dashboard shows result

---

### Phase 4: Polish & Demo (Hours 13–24) — **Buffer time**

**Task 4a:** Test with real X posts (if API quota allows)
**Task 4b:** Refine urgency detection (collect misclassifications, adjust rules)
**Task 4c:** Add charts/metrics to dashboard (complaints per category, urgency distribution)
**Task 4d:** Write demo script and prepare examples
**Task 4e:** Deploy (Vercel + Railway)

---

### Parallelization Tips:
- **Person A (Backend):** Tasks 1a → 2 → 3a
- **Person B (Frontend):** Tasks 1b → 3b → polish
- **Person C (If 3rd member):** Data generation + testing + demo preparation

---

## 9. Demo Script (CRITICAL)

### Setup:
- Have 3–4 real X posts with #complaints_gov ready (or fake them for control)
- Dashboard running on one screen
- Terminal showing API calls on second screen

### Demo Flow (5 minutes):

**Intro (30 sec):**
> "Governments get thousands of complaints via email, calls, social media. The problem: they're messy, unstructured, and manually sorted. We built a system that scrapes citizen complaints from X, automatically categorizes them, extracts location, rates urgency, and routes them. Let me show you."

**Demo Part 1: Real-Time Ingestion (1 min):**
> "I'm going to post a complaint on X right now with #complaints_gov..."
- **Post:** "Broken streetlight on Main Street. Kids can't walk to school safely. PLEASE FIX!"
- Wait 10 seconds → Dashboard auto-updates
- Show the new complaint appearing in the list

**Demo Part 2: ML Extraction (2 min):**
> "Watch what the system extracted automatically..."
- Click complaint detail
- Show:
  - **Category:** Infrastructure (95% confidence)
  - **Location:** Main Street (highlighted)
  - **Urgency:** High (detected keywords: "broken", "safely", "PLEASE FIX")
  - **Department:** Public Works
  - **Summary:** "Unsafe streetlight outage near school on Main Street—immediate safety risk"
  - **Link to original X post** ← judges click to verify it's real

**Demo Part 3: Batch Processing (1.5 min):**
> "Let's show it scales. Here are 10 more complaints we processed..."
- Show dashboard filtered by "High Urgency" → 3 complaints visible
- Click each one, highlight different categories
- Example 2:
  - Post: "Water tap not working in Sector 5. No water for 2 days!"
  - System → Category: Water, Urgency: High, Location: Sector 5, Department: Water Works
- Example 3:
  - Post: "Pothole. Its bad."
  - System → Category: Infrastructure, Urgency: Medium, Location: (none extracted), Confidence: 0.65

**Demo Part 4: Value (30 sec):**
> "Instead of a clerk manually reading 10 complaints and filling out forms for 30 minutes, the system does it in 30 seconds. The government can now focus on solving problems, not sorting them."

### Key Points:
- ✅ Show **real data** (X posts, not mock)
- ✅ Show **all 4 components working:** classification, NER, urgency, summarization
- ✅ Show **confidence scores** (judges like seeing 0.87, not just "Infrastructure")
- ✅ Show **speed** (complaints appear in dashboard in <5 seconds)
- ✅ Show **accuracy** (correct categories, correct departments)

---

## 10. Evaluation & Metrics

### During Development:

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Classification Accuracy** | >85% on 50 test complaints | Confusion matrix (scikit-learn) |
| **Location Extraction** | >75% on test set | Manual spot-check 10 extractions |
| **Urgency Detection** | >80% on test set | Compare rule vs. manually labeled |
| **Summarization Quality** | Subjective but clear & actionable | Read 5 summaries, ask: "Would a clerk understand this?" |
| **End-to-End Latency** | <5 sec from X post to dashboard | Time from X API fetch to DB insert |

### For Demo Judges:

**They'll care about:**
1. **Accuracy:** Does it classify correctly? (Spot-check 3 examples)
2. **Speed:** How fast does it work? (Should be <5 sec)
3. **Clarity:** Is the output understandable? (Summaries, categories, locations)
4. **Scalability:** Could this handle 100 posts/day? (Show sample data)
5. **Real Problem:** Does it actually solve a real pain point? (Yes—manual triage is slow)

### Metrics Dashboard:
Add to dashboard:
```
Total Complaints: 47
├─ By Urgency: High (12), Medium (20), Low (15)
├─ By Category: Infrastructure (15), Water (10), Health (8), Other (14)
├─ By Department: PWD (15), Water Works (10), Health Dept (8), Unknown (14)
└─ Processing Time: Avg 3.2 sec
```

---

## 11. Stretch Features (If Time Permits)

### Stretch 1: Department Email Routing
- Integrate with SMTP to auto-email complaints to department inboxes
- Email template: `[URGENT] Pothole reported on Main St via #complaints_gov`
- **Time:** +2 hours

### Stretch 2: Citizen Feedback Loop
- Add QR code on dashboard → citizens can rate if issue was resolved
- Feedback stores in DB → improves future classification
- **Time:** +3 hours

### Stretch 3: Multi-Language Support
- Detect language (langdetect library) → translate to English (Google Translate API)
- Process in English → return results in original language
- **Time:** +2 hours (if free API quota available)

### Stretch 4: Geospatial Mapping
- Map all complaints on interactive map (Folium or Mapbox)
- Cluster by location → "5 pothole complaints on Main Street"
- Heatmap by urgency
- **Time:** +3 hours

### Stretch 5: Model Fine-Tuning
- Use user corrections from dashboard to retrain classifier
- Version model → A/B test new vs. old
- **Time:** +4 hours

---

## 12. Risks & Smart Shortcuts

### Risk 1: X API Rate Limits
- **Problem:** X API free tier allows 450 requests/15 min; with hashtag search + fetch details, you burn quota fast
- **Smart Shortcut:** Use cached mock X posts for demo; 1–2 real posts if quota allows
- **Solution:** Pre-fetch 20 posts before demo starts; run ingestion every 30 min (not 5 min)

### Risk 2: ML Models Are Slow
- **Problem:** Transformers (BERT, etc.) take 30+ sec per post on CPU
- **Smart Shortcut:** Use scikit-learn + spaCy (runs in <1 sec)
- **Solution:** Pre-compute predictions on mock data; cache results

### Risk 3: NER Doesn't Extract Informal Locations
- **Problem:** spaCy finds "Main Street" but not "near the mosque" or "downtown"
- **Smart Shortcut:** Don't try to perfect this. Accept 70% extraction rate; mark others as "Location unclear"
- **Solution:** Add fallback regex for street patterns: `\d+ .*?(Street|Road|Avenue)`

### Risk 4: Summarization Takes Too Long
- **Problem:** Hugging Face transformers summarization: 5–10 sec per post
- **Smart Shortcut:** Use OpenAI API (super fast, ~0.5 sec) OR use simple extractive summarization (pick first + last sentence)
- **Solution:** Pre-generate summaries for demo posts the night before

### Risk 5: Database Schema Changes Late
- **Problem:** You realize you need a new field (e.g., "assigned_to_officer") halfway through
- **Smart Shortcut:** Use SQLite; migrations are instant for small data
- **Solution:** Plan schema early (Task 1a); leave room for "metadata" JSON column for flexibility

### Risk 6: Judges Test Edge Cases
- **Problem:** Judge posts a complaint in bad grammar or sarcasm; system fails
- **Smart Shortcut:** Don't promise 100% accuracy. Say "Captures 85%+ of real-world complaints; edge cases flagged for manual review"
- **Solution:** Add "Confidence Score" field; complaints <0.6 confidence are marked "Manual Review Needed"

### Risk 7: Frontend Not Ready When Backend is
- **Problem:** ML pipeline done but frontend still building (or vice versa)
- **Smart Shortcut:** Build API-first; swap in real frontend later. Demo with Postman/curl if needed
- **Solution:** Mock API endpoints in frontend early; switch to real backend when ready

### Smart Shortcut: Deterministic Department Routing
- **Problem:** Smart routing could be complex (what if complaint mentions multiple departments?)
- **Smart Shortcut:** Use simple rules:
  ```python
  category_to_dept = {
      "Infrastructure": "Public Works",
      "Water": "Water Department",
      "Health": "Health Ministry",
      ...
  }
  ```
- **Solution:** 90% of complaints map cleanly; don't over-engineer

---

## Build Checklist

- [ ] Backend: FastAPI project + SQLite schema
- [ ] X API: Fetch posts with #complaints_gov
- [ ] ML: Train classifier, NER, summarization
- [ ] Backend: `/api/complaints` + `/api/process` endpoints
- [ ] Frontend: React dashboard skeleton
- [ ] Integration: Wire ML to ingestion job
- [ ] Frontend: Add filters, detail view, real-time updates
- [ ] Testing: Run end-to-end with 10 test complaints
- [ ] Polish: Add confidence scores, metrics dashboard
- [ ] Demo: Prepare 3–4 example X posts, write script
- [ ] Deployment: Push to Vercel + Railway (if time)
- [ ] Documentation: README with architecture diagram

---

## Success Criteria

✅ **System works end-to-end:** X post → classification → dashboard display (< 5 sec)
✅ **ML accuracy:** >80% on category classification
✅ **Dashboard is usable:** Filters work, detail view shows all metadata
✅ **Demo is smooth:** Show 3 examples without errors, judges understand the value
✅ **Code is clean:** Easy to explain, easy for judges to extend

**Good luck! Ship fast, demo fearlessly. 🚀**
