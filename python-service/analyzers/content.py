"""
Content Analyzer — Hook detection, CTA detection, keyword extraction
"""
import re
from typing import TypedDict
from keybert import KeyBERT
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

# Hook patterns and their types
HOOK_PATTERNS = {
    "question": [
        r"^(what|how|why|when|where|who|which|did you|have you|do you|can you|would you|are you|is this|will you)",
        r"\?$",
    ],
    "stat": [
        r"^\d+[\%\$]",
        r"^(in \d+|after \d+|\d+ out of|\d+ ways|\d+ things|\d+ tips|\d+ secrets|\d+ mistakes)",
    ],
    "controversial": [
        r"^(unpopular opinion|controversial|hot take|nobody talks about|stop doing|i was wrong|the truth about|they don't want you to know)",
    ],
    "story": [
        r"^(i (was|used to|never|always|almost|couldn't)|when i|the day i|last (week|month|year)|true story)",
        r"^(this changed|it happened|one day|story time)",
    ],
    "statement": [
        r"^(the #?1|here's why|this is why|the reason|the secret|the key|the truth|what nobody|most people)",
    ],
}

CTA_PATTERNS = [
    r"\b(follow|subscribe|like|comment|share|save|tag|dm|click the link|link in bio|swipe up|check out)\b",
    r"\b(let me know|drop a|leave a|hit the|turn on|turn off|hit follow)\b",
]

class ContentAnalyzer:
    def __init__(self):
        self._kw_model: KeyBERT | None = None

    @property
    def kw_model(self) -> KeyBERT:
        if self._kw_model is None:
            logger.info("Loading KeyBERT model...")
            self._kw_model = KeyBERT(model=SentenceTransformer("all-MiniLM-L6-v2"))
        return self._kw_model

    def analyze_hook(self, text: str) -> dict:
        """
        Analyze the hook quality of content (first ~100 chars / first sentence).
        Returns score (0-1), hook_text, hook_type, feedback.
        """
        if not text or not text.strip():
            return {"score": 0.0, "hook_text": "", "hook_type": "none", "feedback": "No content to analyze"}

        # Take first sentence or first 150 chars
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        hook_text = sentences[0][:200] if sentences else text[:200]
        hook_lower = hook_text.lower().strip()

        detected_type = "none"
        base_score = 0.2  # default: no real hook

        for hook_type, patterns in HOOK_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, hook_lower, re.IGNORECASE):
                    detected_type = hook_type
                    base_score = self._score_by_type(hook_type)
                    break
            if detected_type != "none":
                break

        # Boost for power words
        power_words = [
            "secret", "proven", "never", "always", "guaranteed", "instantly",
            "surprising", "shocking", "bizarre", "incredible", "life-changing",
            "mistake", "warning", "finally", "exposed", "banned",
        ]
        power_word_count = sum(1 for w in power_words if w in hook_lower)
        score = min(1.0, base_score + power_word_count * 0.05)

        # Penalize for weak starters
        weak_starters = ["hi ", "hey ", "hello ", "welcome", "today i", "in this video", "in today's"]
        for weak in weak_starters:
            if hook_lower.startswith(weak):
                score = max(0.1, score - 0.2)
                break

        return {
            "score": round(score, 3),
            "hook_text": hook_text,
            "hook_type": detected_type,
            "feedback": self._generate_feedback(detected_type, score, hook_text),
        }

    def _score_by_type(self, hook_type: str) -> float:
        scores = {
            "question": 0.7,
            "stat": 0.8,
            "controversial": 0.85,
            "story": 0.65,
            "statement": 0.7,
        }
        return scores.get(hook_type, 0.5)

    def _generate_feedback(self, hook_type: str, score: float, hook_text: str) -> str:
        if score >= 0.8:
            return f"Strong {hook_type} hook. Creates immediate curiosity."
        elif score >= 0.6:
            return f"Decent {hook_type} hook. Could be stronger with more specific/surprising opening."
        elif score >= 0.4:
            return f"Weak hook detected. Try opening with a bold statement, surprising stat, or provocative question."
        else:
            return f"No effective hook. Your first 3 seconds should grab attention — start with a pattern interrupt, not an intro."

    def detect_cta(self, text: str) -> bool:
        """Detect if content contains a call-to-action."""
        if not text:
            return False
        text_lower = text.lower()
        for pattern in CTA_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return True
        return False

    def extract_keywords(self, text: str, top_n: int = 10) -> list[str]:
        """Extract top keywords using KeyBERT (semantic keyword extraction)."""
        if not text or len(text) < 20:
            return []
        try:
            keywords = self.kw_model.extract_keywords(
                text,
                keyphrase_ngram_range=(1, 2),
                stop_words="english",
                use_maxsum=True,
                nr_candidates=20,
                top_n=top_n,
            )
            return [kw[0] for kw in keywords]
        except Exception as e:
            logger.warning(f"Keyword extraction failed: {e}")
            return []

    def extract_visual_categories(self, labels: list[str]) -> list[str]:
        """Map raw image labels to high-level content categories."""
        category_map = {
            "fitness": ["gym", "workout", "exercise", "muscle", "running", "yoga"],
            "food": ["food", "meal", "cooking", "restaurant", "recipe"],
            "travel": ["beach", "mountain", "city", "travel", "hotel", "landscape"],
            "fashion": ["clothing", "outfit", "fashion", "style", "accessories"],
            "tech": ["computer", "phone", "gadget", "technology", "screen"],
            "education": ["book", "study", "classroom", "whiteboard"],
            "finance": ["money", "cash", "investment", "chart", "graph"],
        }

        result = set()
        labels_lower = [l.lower() for l in labels]
        for category, keywords in category_map.items():
            if any(kw in label for kw in keywords for label in labels_lower):
                result.add(category)

        return list(result)
