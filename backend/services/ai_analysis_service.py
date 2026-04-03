from ai.text_model import analyze_text
from ai.image_model import analyze_image
from ai.scorer import compute_risk_score, threat_level
from ai.duplicate_detector import check_duplicate_url

from ai.reputation import check_reputation_api
import urllib.parse
import httpx
import re

class AIAnalysisService:
    @staticmethod
    async def fetch_page(url: str) -> str:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(url, timeout=5.0)
                # Quick strip of HTML tags
                text = re.sub('<[^<]+>', ' ', res.text[:5000])
                return text
        except:
            return ""

    @staticmethod
    def is_suspicious_text(text: str) -> bool:
        # Standard English + Indian/Hinglish abusive terms
        keywords = ["porn", "xxx", "betting", "casino", "drugs", "csam", "rape", "murder", "child", 
                    "bc", "mc", "bhosd", "chutiy", "madarchod", "behenchod", "randi", "gandu", "maar dalunga", "kutta"]
        return any(k in text.lower() for k in keywords)

    @staticmethod
    async def analyze_evidence(evidence_type: str, content: bytes, description: str = None) -> dict:
        """
        Single-box layered processing.
        Handles text, fetched URL content, and images simultaneously.
        """
        category = "unknown"
        is_duplicate = False
        repeat_count = 0
        domain = None
        
        # Merge all textual inputs from description or content (if it's not a binary file like image)
        text_content = ""
        if description: text_content += description + " "
        if evidence_type in ["text", "url", "mixed"] and content:
            try:
                # Use strict decoding: if it's a JPG, it throws an error and cleanly skips appending binary gibberish into the text pipeline.
                text_content += content.decode("utf-8", errors="strict")
            except UnicodeDecodeError:
                pass
                
        # 1. URL Lifecycle (Domain, Reputation, Fetch)
        text_score_penalty = 0.0
        if text_content and "http" in text_content:
            try:
                words = text_content.split()
                for w in words:
                    if w.startswith("http"):
                        # Extract Domain
                        parsed = urllib.parse.urlparse(w)
                        domain = parsed.netloc
                        
                        # Layer 1: DB Check
                        is_duplicate, repeat_count = check_duplicate_url(domain)
                        
                        # Layer 2: API Reputation Check (Google Safe Browsing Mock)
                        rep_res = await check_reputation_api(w)
                        if rep_res["is_malicious"]:
                            text_score_penalty += 0.8
                            category = rep_res["threat_type"]
                            
                        # Layer 3: Lightweight Fetch
                        html_text = await AIAnalysisService.fetch_page(w)
                        text_content += " " + html_text
                        break
            except Exception:
                pass
                
        # Layer 4: Heuristics / Keyword Scan
        if AIAnalysisService.is_suspicious_text(text_content):
            text_score_penalty += 0.3
            if category == "unknown": category = "suspicious_keywords"
            
        # 5. Deep ML NLP (XLM-RoBERTa)
        text_score = 0.0
        if text_content.strip():
            ml_text_score = await analyze_text(text_content)
            # Combine heuristic penalty with ML score
            text_score = min(ml_text_score + text_score_penalty, 1.0)
            if ml_text_score > 0.5: category = "hate_speech_or_harassment"
            
        # 6. Deep Vision (NSFW/CSAM)
        vision_score = 0.0
        # Check if the evidence_type explicitly states image OR mixed payload format signifies image bytes
        if evidence_type in ["image", "mixed"] and content and len(content) > 100:
            # We assume it's an image if it can't be purely decoded as text
            try:
                content.decode('utf-8')
                # If we get here fully, it might purely be text, skip vision analysis
            except UnicodeDecodeError:
                vision_score = await analyze_image(content)
                if vision_score > 0.5: category = "NSFW_Violation"
            
        # 7. Final Scoring Engine
        risk_score = compute_risk_score(vision_score, text_score, repeat_count)
        
        repeat_offender = repeat_count >= 3
        should_escalate = risk_score >= 0.8 or repeat_offender
        tl = threat_level(risk_score)
        
        return {
            "risk_score": risk_score,
            "threat_level": tl,
            "category": category,
            "confidence": 0.90,
            "is_duplicate": is_duplicate,
            "repeat_offender": repeat_offender,
            "repeat_count": repeat_count,
            "should_escalate": should_escalate,
            "domain": domain
        }
