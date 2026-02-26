"""
Hashtag Analyzer — extract, rank, and categorize hashtags from social media content
"""
import re
import logging
from collections import Counter

logger = logging.getLogger(__name__)

HASHTAG_RE = re.compile(r"#(\w+)", re.UNICODE)


class HashtagAnalyzer:
    """Analyze hashtag usage patterns and suggest optimizations."""

    def extract(self, text: str) -> list[str]:
        """Extract all hashtags from text, lowercase, deduplicated."""
        if not text:
            return []
        return list(dict.fromkeys(t.lower() for t in HASHTAG_RE.findall(text)))

    def count_from_posts(self, posts: list[dict]) -> dict[str, int]:
        """
        Count hashtag frequency across a list of post dicts with a 'caption' field.
        Returns {hashtag: count} sorted by frequency descending.
        """
        counter: Counter = Counter()
        for post in posts:
            tags = self.extract(post.get("caption") or "")
            counter.update(tags)
        return dict(counter.most_common())

    def top_hashtags(self, posts: list[dict], n: int = 20) -> list[str]:
        counts = self.count_from_posts(posts)
        return list(counts.keys())[:n]

    def hashtag_density(self, text: str) -> float:
        """Ratio of hashtag tokens to total words."""
        if not text or not text.strip():
            return 0.0
        words = text.split()
        tags = self.extract(text)
        return round(len(tags) / len(words), 3) if words else 0.0

    def classify(self, hashtag: str) -> str:
        """Heuristic classification: niche | broad | branded | location."""
        tag = hashtag.lower().lstrip("#")
        broad = {
            "love", "instagood", "photooftheday", "follow", "like", "trending",
            "viral", "explore", "fyp", "foryou", "foryoupage", "reels",
        }
        if tag in broad:
            return "broad"
        if any(c.isupper() for c in hashtag):
            return "branded"
        location_hints = ["city", "nyc", "la", "london", "miami", "chicago", "usa", "uk"]
        if any(h in tag for h in location_hints):
            return "location"
        return "niche"
