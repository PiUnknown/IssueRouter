import os
import json
from pathlib import Path
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

CACHE_PATH = Path(__file__).parent.parent / "cache" / "summaries.json"

def _load_cache() -> dict:
    if CACHE_PATH.exists():
        try:
            return json.loads(CACHE_PATH.read_text())
        except:
            return {}
    return {}

def _save_cache(cache: dict):
    CACHE_PATH.write_text(json.dumps(cache, indent=2))

def summarise_cluster(
    cluster_id: str,
    aggregated_texts: list,
    location: str,
    category: str,
    complaint_count: int
) -> str:
    cache = _load_cache()
    cache_key = f"{cluster_id}_{complaint_count}"

    if cache_key in cache:
        return cache[cache_key]

    sample = aggregated_texts[:5]
    combined = "\n".join(f"- {t}" for t in sample)

    prompt = f"""You are a civic grievance analyst briefing a District Magistrate.
Given the following citizen complaint cluster, write ONE sentence (maximum 25 words) for a government officer.
Be factual, location-specific, and actionable. No preamble. No quotes.

Category: {category}
Location: {location}
Total complaints: {complaint_count}
Sample complaints:
{combined}

Output only the brief sentence."""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100
        )
        summary = response.choices[0].message.content.strip()

        cache[cache_key] = summary
        _save_cache(cache)
        return summary

    except Exception as e:
        print(f"[summariser] Groq error: {e}. Falling back to cache.")
        last = [v for k, v in cache.items() if k.startswith(cluster_id)]
        if last:
            return last[-1]
        return f"{complaint_count} complaints about {category.lower()} in {location}. Immediate action required."

def generate_recommended_action(
    category: str,
    location: str,
    urgency: str
) -> str:
    prompt = f"Write a 1-sentence recommended government action for a {urgency} urgency {category} complaint in {location}. Be specific and actionable. No preamble."

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=60
        )
        return response.choices[0].message.content.strip()

    except Exception:
        actions = {
            "Infrastructure": f"Dispatch PWD inspection team to {location} immediately.",
            "Sanitation":     f"Deploy MCD sanitation crew to {location} within 24 hours.",
            "Healthcare":     f"Alert Health Dept for {location}. Send medical response team.",
            "Utilities":      f"Contact Jal Board for {location}. Restore service within 4 hours.",
            "Law and Order":  f"Notify local police for {location}. Increase patrol frequency.",
            "Environment":    f"Raise CPCB alert for {location}. Begin environmental assessment.",
            "Education":      f"Notify District Education Officer for {location}.",
        }
        return actions.get(category, f"Escalate {category} issue in {location} to relevant department immediately.")