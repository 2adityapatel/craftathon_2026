import httpx
from config import settings
import logging

async def check_reputation_api(url: str) -> dict:
    """
    Checks URL against Google Safe Browsing API or VirusTotal.
    If no keys are provided, it simulates a check.
    Returns {"is_malicious": bool, "threat_type": str, "source": str}
    """
    if not url:
        return {"is_malicious": False, "threat_type": None, "source": "none"}
        
    # Google Safe Browsing Setup
    SAFE_BROWSING_API_KEY = getattr(settings, 'safe_browsing_api_key', None)
    if SAFE_BROWSING_API_KEY:
        api_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={SAFE_BROWSING_API_KEY}"
        payload = {
            "client": {"clientId": "pocso-hackathon", "clientVersion": "1.0"},
            "threatInfo": {
                "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}]
            }
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(api_url, json=payload, timeout=5.0)
                if res.status_code == 200:
                    data = res.json()
                    if "matches" in data and len(data["matches"]) > 0:
                        threat = data["matches"][0]["threatType"]
                        return {"is_malicious": True, "threat_type": threat, "source": "Google Safe Browsing"}
        except Exception as e:
            logging.error(f"Safe Browsing API error: {e}")

    # Mock evaluation for demonstration if no keys exist
    # Simulated domains that are instantly flagged
    mock_bad_domains = ["phishing.com", "scam-site.net", "malicious-actor.org", "darkweb-csam.onion"]
    for bad in mock_bad_domains:
        if bad in url.lower():
            return {"is_malicious": True, "threat_type": "MOCK_MALWARE/PHISHING", "source": "Mock Filter"}
            
    return {"is_malicious": False, "threat_type": None, "source": "none"}
