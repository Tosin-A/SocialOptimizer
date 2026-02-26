"""
SocialOptimizer Python AI Service
FastAPI service for compute-heavy tasks: transcription, NLP, scraping
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import structlog

from models.analysis import (
    PostAnalysisRequest, PostAnalysisResponse,
    ProfileScrapeRequest, ProfileScrapeResponse,
    CompetitorAnalysisRequest, CompetitorAnalysisResponse,
)
from services.transcription import TranscriptionService
from analyzers.content import ContentAnalyzer
from analyzers.sentiment import SentimentAnalyzer
from analyzers.hashtags import HashtagAnalyzer
from scrapers.public_scraper import PublicProfileScraper

# ─── Logging ──────────────────────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ],
)
logger = structlog.get_logger()

# ─── Service singletons ───────────────────────────────────────────────────────
transcription_service: TranscriptionService | None = None
content_analyzer: ContentAnalyzer | None = None
sentiment_analyzer: SentimentAnalyzer | None = None
hashtag_analyzer: HashtagAnalyzer | None = None
scraper: PublicProfileScraper | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global transcription_service, content_analyzer, sentiment_analyzer, hashtag_analyzer, scraper
    logger.info("Starting SocialOptimizer Python service...")

    transcription_service = TranscriptionService()
    content_analyzer = ContentAnalyzer()
    sentiment_analyzer = SentimentAnalyzer()
    hashtag_analyzer = HashtagAnalyzer()
    scraper = PublicProfileScraper()

    await scraper.init()
    logger.info("All services initialized")
    yield

    await scraper.close()
    logger.info("Service shutdown complete")

# ─── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SocialOptimizer AI Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVICE_SECRET = os.getenv("PYTHON_SERVICE_SECRET", "")

def verify_secret(x_service_secret: str = Header(...)):
    """Internal auth — only the Next.js backend can call this service."""
    if not SERVICE_SECRET or x_service_secret != SERVICE_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    return True

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "social-optimizer-python"}


@app.post("/analyze/posts", response_model=PostAnalysisResponse)
async def analyze_posts(
    request: PostAnalysisRequest,
    _: bool = Depends(verify_secret)
):
    """
    Analyze a batch of posts:
    - Transcribe audio/video (Whisper)
    - Detect hooks and CTAs
    - Run sentiment analysis
    - Extract keywords
    """
    logger.info("analyze_posts", count=len(request.posts))

    hook_scores = []
    sentiment_scores = []
    cta_count = 0
    post_analyses = []

    for post in request.posts:
        try:
            # Step 1: Transcribe if video
            transcript = ""
            if post.media_url and request.platform in ("tiktok", "instagram", "youtube"):
                try:
                    transcript = await transcription_service.transcribe(post.media_url)
                except Exception as e:
                    logger.warning("transcription_failed", post_id=post.id, error=str(e))

            text = f"{post.caption or ''} {transcript}".strip()

            # Step 2: Analyze hook
            hook_result = content_analyzer.analyze_hook(transcript or post.caption or "")
            hook_scores.append(hook_result["score"])

            # Step 3: Detect CTA
            has_cta = content_analyzer.detect_cta(text)
            if has_cta:
                cta_count += 1

            # Step 4: Sentiment
            sent_score = sentiment_analyzer.analyze(text)
            sentiment_scores.append(sent_score)

            # Step 5: Keywords
            keywords = content_analyzer.extract_keywords(text)

            post_analyses.append({
                "post_id": post.id,
                "transcript": transcript,
                "hook_score": hook_result["score"],
                "hook_text": hook_result["hook_text"],
                "hook_type": hook_result["hook_type"],
                "cta_detected": has_cta,
                "sentiment_score": sent_score,
                "keywords": keywords,
            })
        except Exception as e:
            logger.error("post_analysis_error", post_id=post.id, error=str(e))

    return PostAnalysisResponse(
        hook_scores=hook_scores,
        sentiment_scores=sentiment_scores,
        cta_count=cta_count,
        post_analyses=post_analyses,
    )


@app.post("/scrape/profile", response_model=ProfileScrapeResponse)
async def scrape_profile(
    request: ProfileScrapeRequest,
    _: bool = Depends(verify_secret)
):
    """
    Scrape public profile data for competitor analysis.
    Only accesses publicly visible profile pages.
    """
    logger.info("scrape_profile", platform=request.platform, username=request.username)

    try:
        profile_data = await scraper.get_profile(request.platform, request.username)
        return ProfileScrapeResponse(**profile_data)
    except Exception as e:
        logger.error("scrape_error", error=str(e))
        raise HTTPException(status_code=422, detail=f"Could not scrape profile: {str(e)}")


@app.post("/analyze/competitor", response_model=CompetitorAnalysisResponse)
async def analyze_competitor(
    request: CompetitorAnalysisRequest,
    _: bool = Depends(verify_secret)
):
    """Compare user metrics against a competitor."""
    logger.info("analyze_competitor", username=request.competitor_username)

    try:
        profile = await scraper.get_profile(request.platform, request.competitor_username)
        recent_posts = await scraper.get_recent_posts(request.platform, request.competitor_username)

        # Analyze competitor posts
        comp_engagements = [p.get("engagement_rate", 0) for p in recent_posts]
        comp_avg_eng = sum(comp_engagements) / len(comp_engagements) if comp_engagements else 0

        comp_hashtags = []
        for post in recent_posts:
            comp_hashtags.extend(post.get("hashtags", []))
        top_hashtags = list(set(comp_hashtags))[:20]

        # Hook analysis on competitor content
        hook_scores = []
        for post in recent_posts[:10]:
            hook = content_analyzer.analyze_hook(post.get("caption", ""))
            hook_scores.append(hook["score"])
        avg_hook = sum(hook_scores) / len(hook_scores) if hook_scores else 0

        # Compute gaps
        eng_gap = comp_avg_eng - request.user_engagement_rate
        posting_gap = profile.get("posts_per_week", 0) - request.user_posts_per_week

        # Hashtag differences
        user_hashtag_set = set(request.user_hashtags)
        comp_hashtag_set = set(top_hashtags)
        hashtag_diff = [
            {"hashtag": tag, "competitor_uses": True, "user_uses": False}
            for tag in comp_hashtag_set - user_hashtag_set
        ][:10]

        # Generate tactical recommendations
        tactical_actions = []
        if eng_gap > 0.01:
            tactical_actions.append({
                "action": f"Study {request.competitor_username}'s top posts — their engagement is {eng_gap*100:.1f}% higher. Focus on their hook patterns.",
                "priority": "high",
                "rationale": "Closing the engagement gap is the highest-leverage action."
            })
        if posting_gap > 1:
            tactical_actions.append({
                "action": f"Increase posting frequency by {posting_gap:.1f} posts/week to match competitor cadence.",
                "priority": "medium",
                "rationale": "More content = more algorithm signals = faster growth."
            })
        if hashtag_diff:
            top_missing = [h["hashtag"] for h in hashtag_diff[:5]]
            tactical_actions.append({
                "action": f"Test these hashtags from {request.competitor_username}'s strategy: {', '.join(top_missing)}",
                "priority": "medium",
                "rationale": "Competitor hashtags that you aren't using may unlock new audience segments."
            })

        return CompetitorAnalysisResponse(
            competitor_username=request.competitor_username,
            competitor_followers=profile.get("followers", 0),
            competitor_avg_engagement=comp_avg_eng,
            competitor_posts_per_week=profile.get("posts_per_week", 0),
            competitor_top_hashtags=top_hashtags,
            competitor_avg_hook_score=avg_hook,
            engagement_gap=eng_gap,
            posting_frequency_gap=posting_gap,
            hashtag_differences=hashtag_diff,
            tactical_actions=tactical_actions,
        )
    except Exception as e:
        logger.error("competitor_analysis_error", error=str(e))
        raise HTTPException(status_code=422, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("ENV", "production") == "development",
        workers=2,
    )
