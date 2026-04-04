def compute_risk_score(vision_score: float, text_score: float, repeat_count: int) -> float:
    """
    Consolidates AI outputs into a unified risk score (0.0 to 1.0).
    Using MAX independent scoring logic for highest possible threat tracking.
    DomainHistory is capped at 1.0 (e.g. 5+ reports = 1.0)
    """
    domain_history = min(repeat_count / 5.0, 1.0)
    final_score = max(vision_score, text_score, domain_history)
    return round(final_score, 2)

def threat_level(score: float) -> str:
    if score >= 0.8: return "CRITICAL"
    if score >= 0.6: return "HIGH"
    if score >= 0.4: return "MEDIUM"
    return "LOW"
