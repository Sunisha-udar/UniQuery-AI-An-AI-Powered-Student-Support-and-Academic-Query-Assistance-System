"""
Behavior moderation service.
Handles message classification, warning application, and profile checks.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError
from dataclasses import dataclass
from functools import lru_cache
import logging
import re
from typing import Any, Optional

from fastapi import HTTPException

from app.services.groq_service import get_groq_service
from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

MAX_WARNINGS = 5
MAX_LLM_MODERATION_WORDS = 8
MAX_LLM_MODERATION_CHARS = 80
LLM_WARNING_CONFIDENCE = 0.8
LLM_MODERATION_TIMEOUT_SECONDS = 1.2

_MODERATION_LLM_POOL = ThreadPoolExecutor(max_workers=4)

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
    re.compile(r"^(kya haal (hai|h)|haal (hai|h)|kaise ho|kaisa hai|aur batao|kya chal raha hai)[?.! ]*$"),
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

        llm_assessment = self._assess_with_llm(normalized)
        if llm_assessment is not None:
            return llm_assessment

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

    def _assess_with_llm(self, normalized: str) -> Optional[ModerationAssessment]:
        if not self._should_use_llm_moderation(normalized):
            return None

        try:
            future = _MODERATION_LLM_POOL.submit(_classify_message_semantically, normalized)
            content = future.result(timeout=LLM_MODERATION_TIMEOUT_SECONDS)
            label, confidence, reason = self._parse_llm_result(content)

            if label == "informal_greeting" and confidence >= LLM_WARNING_CONFIDENCE:
                return ModerationAssessment(
                    flagged=True,
                    confidence=confidence,
                    detector="llm_semantic",
                    reason_code="semantic_informal_greeting",
                    reason_detail=reason or "LLM detected an informal greeting or casual chat message.",
                    normalized_text=normalized,
                )

            if label == "academic_query":
                return ModerationAssessment(
                    flagged=False,
                    confidence=confidence,
                    detector="llm_semantic",
                    reason_code="academic_query_detected",
                    reason_detail=reason or "LLM recognized the message as a valid academic query.",
                    normalized_text=normalized,
                )
        except TimeoutError:
            logger.warning("LLM moderation fallback timed out for message: %s", normalized)
        except Exception as exc:
            logger.warning("LLM moderation fallback failed: %s", exc)

        return None

    @staticmethod
    def _should_use_llm_moderation(normalized: str) -> bool:
        if not normalized:
            return False

        words = normalized.split()
        return len(words) <= MAX_LLM_MODERATION_WORDS and len(normalized) <= MAX_LLM_MODERATION_CHARS

    @staticmethod
    def _parse_llm_result(content: str) -> tuple[str, float, str]:
        parts = [part.strip() for part in content.split("|", 2)]
        label = parts[0].lower() if parts else "other"

        try:
            confidence = round(max(0.0, min(float(parts[1]), 1.0)), 3) if len(parts) > 1 else 0.0
        except ValueError:
            confidence = 0.0

        reason = parts[2] if len(parts) > 2 else ""
        return label, confidence, reason


_moderation_service: Optional[ModerationService] = None


def get_moderation_service() -> ModerationService:
    global _moderation_service
    if _moderation_service is None:
        _moderation_service = ModerationService()
    return _moderation_service


@lru_cache(maxsize=256)
def _classify_message_semantically(normalized: str) -> str:
    groq_service = get_groq_service()
    response = groq_service.client.chat.completions.create(
        model=groq_service.model,
        messages=[
            {
                "role": "system",
                "content": (
                    "Classify the user's message for moderation.\n"
                    "Return exactly one line in this format: label|confidence|reason\n"
                    "Allowed labels:\n"
                    "- informal_greeting: greetings, small talk, asking how the bot is, casual banter, thanks, bye\n"
                    "- academic_query: genuine university/academic/help-seeking question\n"
                    "- other: not an informal greeting and not an academic query\n"
                    "Use confidence from 0.00 to 1.00."
                ),
            },
            {
                "role": "user",
                "content": normalized,
            },
        ],
        max_tokens=40,
        temperature=0.0,
    )

    return (response.choices[0].message.content or "").strip()
