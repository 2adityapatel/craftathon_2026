import httpx
from config import settings
# import asyncio

async def analyze_image(image_bytes: bytes) -> float:
    """
    Calls Hugging Face Inference API for google/vit-base-patch16-224 (mocking NSFW/violance output here).
    Returns a toxicity score between 0.0 and 1.0.
    Note: For a real hackathon, you'd use a specific NSFW model (e.g. falconsai/nsfw_image_detection).
    """
    if not settings.huggingface_token:
        return 0.7 # fallback score

    # Using a general NSFW model for demonstration purposes
    API_URL = "https://router.huggingface.co/hf-inference/models/Falconsai/nsfw_image_detection"
    headers = {"Authorization": f"Bearer {settings.huggingface_token}"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(API_URL, headers=headers, content=image_bytes, timeout=10.0)
            if response.status_code == 200:
                results = response.json()
                # Results typically [{"label": "nsfw", "score": 0.98}, {"label": "normal", "score": 0.02}]
                if isinstance(results, list):
                    for r in results:
                        if r.get("label", "").lower() == "nsfw":
                            return float(r.get("score", 0.0))
            return 0.5 # fallback
        except Exception:
            return 0.5
