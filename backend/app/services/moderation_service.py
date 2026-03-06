"""
Behavior moderation service.
Handles message classification, warning application, and profile checks.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
import re
from typing import Any, Optional

from fastapi import HTTPException

from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

MAX_WARNINGS = 5

ACADEMIC_KEYWORDS = {
    "attendance", "exam", "exams", "fee", "fees", "scholarship", "hostel", "library",
    "syllabus", "semester", "department", "program", "course", "courses", "admission",
    "admissions", "certificate", "transcript", "result", "results", "timetable",
    "schedule", "class", "classes", "portal", "placement", "placements", "leave",
    "faculty", "document", "documents", "registration", "marksheet", "deadline",
    "grades", "curriculum", "internship", "bonafide", "migration", "id card",
    "assignment", "assignments", "lab", "labs", "cgpa", "credits", "revaluation",
    "backlog", "subject", "subjects", "batch", "practical", "practicals", "notice",
    "notices", "holiday", "holidays", "rule", "rules", "policy", "policies",
    "semester break", "academic", "university", "college"
}

ACADEMIC_HINT_PATTERNS = (
    re.compile(r"\bwhat\b"),
    re.compile(r"\bwhen\b"),
    re.compile(r"\bhow\b"),
    re.compile(r"\bwhere\b"),
    re.compile(r"\bwhich\b"),
    re.compile(r"\bplease\b"),
    re.compile(r"\bhelp\b"),
    re.compile(r"\bguide\b"),
)

PURE_GREETING_PATTERNS = (
    re.compile(r"^(hi|hii|hiii|hello|hey|heyy|heyy|yo|namaste|good morning|good afternoon|good evening)[!. ]*$"),
    re.compile(r"^(hi|hello|hey)[ ,.!]*(how are you|how r u|how're you|what'?s up|wassup|sup)[?.! ]*$"),
    re.compile(r"^(how are you|how r u|what'?s up|wassup|sup)[?.! ]*$"),
    re.compile(r"^(kya haal hai|kaise ho|kaisa hai|aur batao|kya chal raha hai)[?.! ]*$"),
    re.compile(r"^(thank you|thanks|thx|bye|goodbye|see you)[!. ]*$"),
)


@dataclass
class ModerationAssessment:
    flagged: bool
    confidence: float
    detector: str
    reason_code: str
    reason_detail: str
    normalized_text: str


class ModerationService:
    def __init__(self) -> None:
        self.supabase = get_supabase_client()

    @staticmethod
    def normalize_message(text: str) -> str:
        normalized = re.sub(r"\s+", " ", text.strip().lower())
        return normalized

    def assess_message(self, text: str) -> ModerationAssessment:
        normalized = self.normalize_message(text)

        if self._looks_academic(normalized):
            return ModerationAssessment(
                flagged=False,
                confidence=0.0,
                detector="academic_override",
                reason_code="academic_query_detected",
                reason_detail="Academic keywords or intent detected; no warning applied.",
                normalized_text=normalized,
            )

        if self._matches_pure_greeting(normalized):
            return ModerationAssessment(
                flagged=True,
                confidence=0.99,
                detector="rule_based",
                reason_code="pure_informal_greeting",
                reason_detail="Message is a pure greeting or casual small-talk without academic intent.",
                normalized_text=normalized,
            )

        return ModerationAssessment(
            flagged=False,
            confidence=0.0,
            detector="safe_default",
            reason_code="no_action",
            reason_detail="Message did not meet the threshold for a warning.",
            normalized_text=normalized,
        )

    def get_user_id_from_token(self, authorization: Optional[str]) -> str:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header required")

        token = authorization.replace("Bearer ", "")

        try:
            user = self.supabase.auth.get_user(token)
            return user.user.id
        except Exception as exc:
            logger.error("Error extracting user from token: %s", exc)
            raise HTTPException(status_code=401, detail="Invalid authorization token") from exc

    def get_user_profile(self, user_id: str) -> dict[str, Any]:
        response = self.supabase.table("profiles").select("id, role, suspended").eq("id", user_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        return response.data

    def apply_warning(self, user_id: str, assessment: ModerationAssessment, question: str) -> dict[str, Any]:
        confidence = round(max(0.0, min(assessment.confidence, 1.0)), 3)

        response = self.supabase.rpc(
            "apply_behavior_warning",
            {
                "p_user_id": user_id,
                "p_question": question,
                "p_normalized_text": assessment.normalized_text,
                "p_detector": assessment.detector,
                "p_reason_code": assessment.reason_code,
                "p_reason_detail": assessment.reason_detail,
                "p_confidence": confidence,
            },
        ).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to apply moderation warning")

        result = response.data[0]
        return {
            "warning_count": int(result["warning_count"]),
            "remaining_warnings": int(result["remaining_warnings"]),
            "is_suspended": bool(result["is_suspended"]),
            "suspension_count": int(result["suspension_count"]),
        }

    @staticmethod
    def build_warning_message(warning_count: int, remaining_warnings: int, is_suspended: bool) -> str:
        if is_suspended:
            return (
                "This system only accepts proper academic queries. "
                f"You have reached warning {warning_count} of {MAX_WARNINGS}, and your account has been suspended automatically. "
                "Please contact support or an administrator to request reactivation."
            )

        return (
            "This system is only for proper academic questions. "
            "Do not send informal greetings or casual chat messages here. "
            f"This is warning {warning_count} of {MAX_WARNINGS}. "
            f"{remaining_warnings} warning(s) remain before automatic suspension."
        )

    def _looks_academic(self, normalized: str) -> bool:
        if any(keyword in normalized for keyword in ACADEMIC_KEYWORDS):
            return True

        return any(pattern.search(normalized) for pattern in ACADEMIC_HINT_PATTERNS) and any(
            keyword in normalized for keyword in {"university", "college", "semester", "course", "exam", "attendance", "fee"}
        )

    def _matches_pure_greeting(self, normalized: str) -> bool:
        return any(pattern.fullmatch(normalized) for pattern in PURE_GREETING_PATTERNS)


_moderation_service: Optional[ModerationService] = None


def get_moderation_service() -> ModerationService:
    global _moderation_service
    if _moderation_service is None:
        _moderation_service = ModerationService()
    return _moderation_service
