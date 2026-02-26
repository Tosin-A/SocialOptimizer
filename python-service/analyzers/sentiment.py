"""
Sentiment Analyzer — VADER (social media optimized) + TextBlob fallback
"""
import logging
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """
    Uses VADER (Valence Aware Dictionary and sEntiment Reasoner) which is
    specifically tuned for social media text (handles emojis, slang, caps).
    Returns a compound score from -1.0 (most negative) to +1.0 (most positive).
    """

    def __init__(self):
        self.vader = SentimentIntensityAnalyzer()

    def analyze(self, text: str) -> float:
        """Returns compound sentiment score: -1.0 to +1.0"""
        if not text or not text.strip():
            return 0.0
        try:
            scores = self.vader.polarity_scores(text)
            return round(scores["compound"], 4)
        except Exception as e:
            logger.warning(f"Sentiment analysis failed: {e}")
            return 0.0

    def analyze_batch(self, texts: list[str]) -> list[float]:
        return [self.analyze(t) for t in texts]

    def label(self, score: float) -> str:
        if score >= 0.05:
            return "positive"
        elif score <= -0.05:
            return "negative"
        return "neutral"

    def analyze_engagement_correlation(
        self,
        posts: list[dict]  # [{caption, engagement_rate}]
    ) -> dict:
        """
        Analyze which sentiment level correlates with highest engagement.
        Returns: {best_sentiment, positive_avg, neutral_avg, negative_avg}
        """
        buckets: dict[str, list[float]] = {"positive": [], "neutral": [], "negative": []}

        for post in posts:
            score = self.analyze(post.get("caption", ""))
            label = self.label(score)
            eng = post.get("engagement_rate", 0) or 0
            buckets[label].append(eng)

        avgs = {
            k: sum(v) / len(v) if v else 0.0
            for k, v in buckets.items()
        }

        best = max(avgs, key=lambda k: avgs[k])
        return {
            "best_sentiment": best,
            "positive_avg_engagement": round(avgs["positive"], 4),
            "neutral_avg_engagement": round(avgs["neutral"], 4),
            "negative_avg_engagement": round(avgs["negative"], 4),
        }
