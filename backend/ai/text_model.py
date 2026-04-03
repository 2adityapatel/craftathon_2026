import httpx
import json
from config import settings
import asyncio

async def analyze_text(text: str) -> float:
    """
    Calls Hugging Face Inference API for unitary/toxic-bert.
    Returns a toxicity score between 0.0 and 1.0.
    """
    if not settings.huggingface_token:
        # Fallback for local testing without HF token
        return 0.5

    API_URL = "https://api-inference.huggingface.co/models/unitary/toxic-bert"
    headers = {"Authorization": f"Bearer {settings.huggingface_token}"}
    
    # We use httpx for async
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(API_URL, headers=headers, json={"inputs": text}, timeout=10.0)
            if response.status_code == 200:
                results = response.json()
                # Results typically [[{"label": "toxic", "score": 0.98}, ...]]
                # Find the maximum score among toxic labels
                if isinstance(results, list) and len(results) > 0 and isinstance(results[0], list):
                    max_score = max([item["score"] for item in results[0]])
                    return float(max_score)
            return 0.5 # fallback score
        except Exception:
            return 0.5
