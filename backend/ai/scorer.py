def compute_risk_score(evidence_type: str, content_score: float) -> float:
    """
    Consolidates AI outputs into a unified risk score (0.0 to 1.0).
    For images: it expects content_score to simply be the NSFW probability.
    For text: it expects it to be toxicity.
    """
    # Simple pass-through for now, can be weighted in the future
    return round(content_score, 2)

def threat_level(score: float) -> str:
    if score >= 0.8: return "CRITICAL"
    if score >= 0.6: return "HIGH"
    if score >= 0.4: return "MEDIUM"
    return "LOW"
