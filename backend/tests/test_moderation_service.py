from app.services.moderation_service import ModerationService


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
