import httpx
import logging
from config import settings

async def analyze_text(text: str) -> float:
    """
    Translates Indian languages/Hinglish to pure English and
    then hits the highly accurate toxic-bert model.
    """
    if not settings.huggingface_token:
        # Fallback for local testing without HF token
        return 0.5
        
    try:
        from deep_translator import GoogleTranslator
        # Auto-detect language (Hindi, Hinglish, Marathi, etc) and translate to English
        english_text = GoogleTranslator(source='auto', target='en').translate(text)
        text = english_text
    except Exception as e:
        logging.warning(f"Translation failed, using original text: {e}")

    # Use the pure English toxic-bert since translation normalizes the text flawlessly
    API_URL = "https://router.huggingface.co/hf-inference/models/unitary/toxic-bert"
    headers = {"Authorization": f"Bearer {settings.huggingface_token}"}
    
    # We use httpx for async
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(API_URL, headers=headers, json={"inputs": text}, timeout=10.0)
            if response.status_code == 200:
                results = response.json()
                # The model typically returns [[{'label': 'toxic', 'score': 0.98}, ...]]
                if isinstance(results, list) and isinstance(results[0], list):
                    # Find maximum toxicity score
                    max_score = 0.0
                    for r in results[0]:
                        if r.get("label", "") in ["toxic", "severe_toxic", "obscene", "threat"]:
                            if r.get("score", 0.0) > max_score:
                                max_score = r.get("score", 0.0)
                    return max_score
            return 0.5 # fallback
        except Exception:
            return 0.5
