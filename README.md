# IssueRouter
### Noise to Action
**Team Convergence** · Hackathon Project · April 2026

---

## What is IssueRouter?

IssueRouter is an AI-powered civic grievance triage system that automatically ingests citizen complaints posted on X (Twitter) and converts them into ranked, department-routed action briefs for government officers — in real time.

Citizens already complain on X. They don't need a new app. We listen.

---

## The Problem

Every day, thousands of citizens post civic complaints on X — potholes, water contamination, power cuts, garbage overflow. Government departments have no systematic way to monitor, sort, or prioritise this. Staff manually read tweets, guess which department is responsible, and forward them. Most complaints get lost or misrouted.

**The bottleneck is not resolution. It is sorting.**

---

## Our Solution

A three-layer system:

**1. Ingestion** — Continuously scrapes X posts tagged with a campaign hashtag (`#complaints_gov`). No new app required for citizens.

**2. AI Pipeline** — Every post is automatically processed through:
- Text classification → assigns issue category (Infrastructure, Sanitation, Health, etc.)
- Named Entity Recognition → extracts location, landmarks, departments
- Urgency scoring → keyword rules + social signal boost (retweet count amplifies priority)
- Semantic clustering → groups similar complaints into one issue cluster
- LLM summarisation → generates a clean one-line officer brief via Claude AI

**3. Officer Dashboard** — Government officers see ranked cluster cards, not individual tweets. Each card shows:
- Priority rank (#1, #2, #3...) computed from complaint volume × social reach
- Location, responsible department, problem description
- AI-generated recommended action
- One-click actions: Assign / Resolve / Escalate / Export Brief

---

## Why This Wins

- **Zero friction for citizens** — they use X as they already do
- **Novel intake channel** — no civic tech product currently does X-based automated triage at this level
- **Full AI/ML pipeline** — classification, NER, clustering, and LLM summarisation working together
- **Demo-ready** — raw messy tweet in → structured ranked actionable brief out, in under 2 seconds
- **Real-world deployable** — one API key swap from mock data to live X stream

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, shadcn/ui, Recharts |
| Backend | Python, FastAPI, SQLAlchemy, SQLite |
| Classification | facebook/bart-large-mnli (zero-shot) |
| NER | spaCy en_core_web_sm + custom EntityRuler |
| Clustering | sentence-transformers/all-MiniLM-L6-v2 |
| Summarisation | Claude Haiku (Anthropic API) |
| Ingestion | Tweepy FilteredStream / mock replay |

---

## Demo Flow

1. Citizens post complaints on X with `#complaints_gov`
2. System ingests, classifies, clusters, and scores every post automatically
3. Officer opens dashboard → sees ranked issue clusters, not a tweet feed
4. Officer clicks **Assign** → complaint is formally routed to the right department
5. One-page brief exported for the District Magistrate's morning review

---

## Team Convergence

Built for hackathon 2026.

> *"AI's job here is not to solve the problem — it's to make sure the right person sees it first."*

---

*© 2026 Team Convergence. Original idea conceived and documented April 2026.*