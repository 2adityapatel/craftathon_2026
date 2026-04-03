from ai.text_model import analyze_text
from ai.image_model import analyze_image
from ai.scorer import compute_risk_score, threat_level
from ai.duplicate_detector import check_duplicate_url
import urllib.parse

class AIAnalysisService:
    @staticmethod
    async def analyze_evidence(evidence_type: str, content: bytes, description: str = None) -> dict:
        """
        Runs the full AI pipeline and duplicate detection.
        Returns a dictionary of analysis metrics.
        """
        risk_score = 0.0
        category = "unknown"
        is_duplicate = False
        repeat_count = 0
        domain = None
        
        # 1. Scoring and classification
        if evidence_type == "text":
            score = await analyze_text(content.decode("utf-8", errors="ignore"))
            risk_score = compute_risk_score("text", score)
            category = "harassment" if risk_score > 0.5 else "other"
            
        elif evidence_type == "image":
            score = await analyze_image(content)
            risk_score = compute_risk_score("image", score)
            category = "NSFW" if risk_score > 0.5 else "other"
            
        elif evidence_type == "url":
            # Assume description holds the url or the content is the url
            url_str = None
            if description and description.startswith("http"):
                url_str = description
            else:
                url_str = content.decode("utf-8", errors="ignore")
                
            score = await analyze_text(url_str)
            risk_score = compute_risk_score("url", score)
            category = "hate_speech"
            
            # Extract domain for duplicate checking
            try:
                parsed = urllib.parse.urlparse(url_str)
                domain = parsed.netloc
                is_duplicate, repeat_count = check_duplicate_url(domain)
            except Exception:
                pass
                
        else:
            # Fallback for video or screenshot
            risk_score = 0.5
            category = "other"
            
        repeat_offender = repeat_count >= 3
        should_escalate = risk_score >= 0.8 or repeat_offender
        tl = threat_level(risk_score)
        
        return {
            "risk_score": risk_score,
            "threat_level": tl,
            "category": category,
            "confidence": 0.85, # mocked confidence
            "is_duplicate": is_duplicate,
            "repeat_offender": repeat_offender,
            "repeat_count": repeat_count,
            "should_escalate": should_escalate,
            "domain": domain
        }
