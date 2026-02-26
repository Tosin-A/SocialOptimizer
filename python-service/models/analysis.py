"""Pydantic models for Python service API requests/responses."""
from pydantic import BaseModel, Field
from typing import Optional, Literal


class PostInput(BaseModel):
    id: str
    caption: Optional[str] = None
    media_url: Optional[str] = None
    platform: str


class PostAnalysisRequest(BaseModel):
    posts: list[PostInput]
    platform: str


class SinglePostAnalysis(BaseModel):
    post_id: str
    transcript: str
    hook_score: float
    hook_text: str
    hook_type: str
    cta_detected: bool
    sentiment_score: float
    keywords: list[str]


class PostAnalysisResponse(BaseModel):
    hook_scores: list[float]
    sentiment_scores: list[float]
    cta_count: int
    post_analyses: list[SinglePostAnalysis]


class ProfileScrapeRequest(BaseModel):
    platform: Literal["tiktok", "instagram", "youtube", "facebook"]
    username: str


class ProfileScrapeResponse(BaseModel):
    platform_user_id: str
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    followers: Optional[int] = None
    niche: Optional[str] = None
    avg_engagement_rate: Optional[float] = None
    posts_per_week: Optional[float] = None
    top_hashtags: list[str] = []
    content_formats: list[str] = []


class CompetitorAnalysisRequest(BaseModel):
    platform: Literal["tiktok", "instagram", "youtube", "facebook"]
    competitor_username: str
    user_engagement_rate: float
    user_posts_per_week: float
    user_hashtags: list[str] = []


class TacticalAction(BaseModel):
    action: str
    priority: Literal["high", "medium", "low"]
    rationale: str


class HashtagDifference(BaseModel):
    hashtag: str
    competitor_uses: bool
    user_uses: bool


class CompetitorAnalysisResponse(BaseModel):
    competitor_username: str
    competitor_followers: int
    competitor_avg_engagement: float
    competitor_posts_per_week: float
    competitor_top_hashtags: list[str]
    competitor_avg_hook_score: float
    engagement_gap: float
    posting_frequency_gap: float
    hashtag_differences: list[HashtagDifference]
    tactical_actions: list[TacticalAction]
