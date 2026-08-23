# IssueRouter — Technical Glossary

Welcome to the team! This glossary defines the core technical terms, frameworks, and artificial intelligence (AI) concepts used in the IssueRouter project, in simple terms.

---

## 1. Natural Language Processing (NLP) & AI Terms

### Zero-Shot Text Classification
* **What it is**: The ability of an AI model to classify a piece of text into categories it has *never* explicitly been trained on.
* **How we use it**: We pass citizen tweets to a pre-trained model called `BART-large-MNLI` and tell it to categorize them into `Sanitation`, `Infrastructure`, `Health`, `Water`, `Safety`, etc. No training dataset is needed.

### Named Entity Recognition (NER)
* **What it is**: The process of identifying and extracting specific names, locations, dates, and entities from unstructured text.
* **How we use it**: When a citizen writes: *"Garbage lying near Connaught Place"* the model automatically extracts `"Connaught Place"` as the **Location**.

### spaCy & EntityRuler
* **What it is**: `spaCy` is a fast, lightweight library for Python designed to help programs understand human language. An `EntityRuler` is a rule-based component inside spaCy that lets us define manual patterns (like a list of local Indian areas) so the program can match them instantly.
* **How we use it**: We load a gazetteer of Indian localities into the `EntityRuler` to ensure the system accurately flags municipal regions in incoming tweets.

### Sentence Embeddings
* **What it is**: The process of converting a sentence of text into a list of numbers (a mathematical vector) that represents its semantic meaning.
* **How we use it**: We use the `all-MiniLM-L6-v2` model to turn tweets into embeddings. If two tweets have similar numbers, it means they are complaining about the same issue.

### Cosine Similarity
* **What it is**: A mathematical formula used to measure how close two vectors (embeddings) are to each other. It outputs a score between `-1.0` and `1.0`.
* **How we use it**: We compare a new tweet's embedding with existing complaint clusters. If the similarity score is `0.70` or higher, the system merges the new tweet into the existing group. Otherwise, it spawns a new cluster.

### Large Language Model (LLM) Summarization (Groq API)
* **What it is**: A massive AI model (like ChatGPT) used to summarize text. `Groq` is a high-speed cloud platform that hosts these models.
* **How we use it**: We call the `llama-3.1-8b-instant` model via the Groq API to convert raw, messy tweets in a cluster into a single, clean brief (e.g. *"Pot-hole near block B Connaught Place causing traffic jams"*).

---

## 2. Backend & Database Terms

### FastAPI
* **What it is**: A modern, high-speed Python web framework used to build APIs (Application Programming Interfaces) that send data between the database and the React user interface.
* **How we use it**: Wires up all backend routes (like `/clusters` and `/stats`) and handles requests from the frontend.

### Uvicorn
* **What it is**: The server engine that runs the FastAPI application.
* **How we use it**: We run `uvicorn main:app` to launch the local backend web server on port `8000`.

### Object-Relational Mapper (ORM) & SQLAlchemy
* **What it is**: An ORM is a tool that allows developers to interact with database tables using standard Python code (objects and classes) instead of writing raw SQL database queries.
* **How we use it**: `SQLAlchemy` translates our Python database models (e.g. `Complaint`, `Cluster`) into SQL queries behind the scenes.

### SQLite
* **What it is**: A lightweight, self-contained database that stores all data in a single local file (`issuerouter.db`) on your computer instead of running a separate database server.
* **How we use it**: Stores raw tweets, processed complaints, issue clusters, and logged actions.

### Pydantic
* **What it is**: A library used in Python to guarantee that the data coming into or leaving our APIs matches strict validation rules (schemas).
* **How we use it**: Checks that incoming payloads contain correctly formatted fields (like ensuring a tweet ID is a string, and likes is an integer) before processing.

### CORS (Cross-Origin Resource Sharing)
* **What it is**: A security mechanism built into web browsers that blocks a webpage hosted on one port (e.g., frontend on `5173`) from making requests to a server on another port (e.g., backend on `8000`) unless explicitly permitted.
* **How we use it**: FastAPI is configured to allow requests from the React frontend port so they can communicate smoothly.

---

## 3. Core Calculations

### Priority Score
* **What it is**: A numeric score calculated by the system to rank clusters on the dashboard so that officers see the most urgent issues at the top.
* **Formula**: 
  $$\text{Priority Score} = (\text{Complaint Count} \times 1.0) + (\text{Social Reach} \times 0.3) + \text{Urgency Weight}$$
* **Weights**: `critical` (200), `high` (100), `medium` (40), `low` (10).
