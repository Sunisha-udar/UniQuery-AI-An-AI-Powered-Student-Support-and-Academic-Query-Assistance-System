from app.services.moderation_service import ModerationAssessment, ModerationService


def test_pure_greeting_is_flagged():
    service = ModerationService()
    assessment = service.assess_message("hi, how are you? kya haal hai?")

    assert assessment.flagged is True
    assert assessment.reason_code in {"pure_informal_greeting", "llm_informal_greeting"}


def test_academic_message_is_not_flagged():
    service = ModerationService()
    assessment = service.assess_message("Hi, what is the attendance policy for semester 3?")

    assert assessment.flagged is False
    assert assessment.reason_code == "academic_query_detected"


def test_llm_semantic_fallback_flags_ambiguous_casual_message(monkeypatch):
    service = ModerationService()

    monkeypatch.setattr(
        ModerationService,
        "_assess_with_llm",
        lambda self, normalized: ModerationAssessment(
            flagged=True,
            confidence=0.91,
            detector="llm_semantic",
            reason_code="semantic_informal_greeting",
            reason_detail="casual chat",
            normalized_text=normalized,
        ),
    )

    assessment = service.assess_message("aap kaise ho dost")

    assert assessment.flagged is True
    assert assessment.detector == "llm_semantic"
