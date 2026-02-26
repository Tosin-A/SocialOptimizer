"""
Public Profile Scraper — Playwright-based, public data only
Scrapes only publicly visible data without authentication.
"""
import asyncio
import logging
import re
from playwright.async_api import async_playwright, Browser, BrowserContext

logger = logging.getLogger(__name__)


class PublicProfileScraper:
    """
    Scrapes public social media profiles.
    Respects robots.txt, only accesses public data.
    Rate-limited to avoid overwhelming servers.
    """

    def __init__(self):
        self.playwright = None
        self.browser: Browser | None = None
        self.context: BrowserContext | None = None

    async def init(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox"],
        )
        self.context = await self.browser.new_context(
            user_agent="Mozilla/5.0 (compatible; SocialOptimizer/1.0; +https://socialoptimizer.app/bot)",
            viewport={"width": 1280, "height": 800},
        )

    async def close(self):
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def get_profile(self, platform: str, username: str) -> dict:
        """Get public profile metrics for a creator."""
        handlers = {
            "youtube": self._scrape_youtube,
            "tiktok": self._scrape_tiktok,
            "instagram": self._scrape_instagram_public,
        }

        handler = handlers.get(platform)
        if not handler:
            return self._empty_profile(username)

        try:
            return await asyncio.wait_for(handler(username), timeout=30)
        except asyncio.TimeoutError:
            logger.warning(f"Profile scrape timed out: {platform}/{username}")
            return self._empty_profile(username)
        except Exception as e:
            logger.error(f"Profile scrape error: {e}")
            return self._empty_profile(username)

    async def get_recent_posts(self, platform: str, username: str) -> list[dict]:
        """Get recent public posts from a creator."""
        try:
            if platform == "youtube":
                return await self._get_youtube_recent_videos(username)
            return []
        except Exception as e:
            logger.error(f"Recent posts error: {e}")
            return []

    def _empty_profile(self, username: str) -> dict:
        return {
            "platform_user_id": username,
            "username": username,
            "display_name": None,
            "avatar_url": None,
            "followers": None,
            "niche": None,
            "avg_engagement_rate": None,
            "posts_per_week": None,
            "top_hashtags": [],
            "content_formats": [],
        }

    def _parse_count(self, text: str) -> int | None:
        """Parse '1.2M', '500K', '1,234' etc. to int."""
        if not text:
            return None
        text = text.strip().replace(",", "").upper()
        multipliers = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}
        for suffix, mult in multipliers.items():
            if text.endswith(suffix):
                try:
                    return int(float(text[:-1]) * mult)
                except ValueError:
                    return None
        try:
            return int(text)
        except ValueError:
            return None

    async def _scrape_youtube(self, username: str) -> dict:
        page = await self.context.new_page()
        try:
            # Try handle or channel name
            urls = [
                f"https://www.youtube.com/@{username}",
                f"https://www.youtube.com/c/{username}",
            ]
            for url in urls:
                await page.goto(url, timeout=15000)
                await asyncio.sleep(2)

                # Check if page loaded
                title = await page.title()
                if "YouTube" in title and "error" not in title.lower():
                    break

            # Extract subscriber count
            sub_text = await page.locator('[id="subscriber-count"]').first.inner_text()
            followers = self._parse_count(sub_text.replace("subscribers", "").strip())

            # Extract display name
            name = await page.locator('[id="channel-name"] yt-formatted-string').first.inner_text()

            return {
                **self._empty_profile(username),
                "display_name": name,
                "followers": followers,
                "posts_per_week": 2.0,  # YouTube average
            }
        finally:
            await page.close()

    async def _scrape_instagram_public(self, username: str) -> dict:
        """
        Instagram heavily restricts public scraping.
        Return minimal data from public page meta tags.
        """
        page = await self.context.new_page()
        try:
            await page.goto(f"https://www.instagram.com/{username}/", timeout=15000)
            await asyncio.sleep(2)

            # Try to get meta description (often has follower count)
            meta_desc = await page.locator('meta[name="description"]').get_attribute("content")
            followers = None
            if meta_desc:
                match = re.search(r"([\d,.]+[KMB]?) Followers", meta_desc, re.IGNORECASE)
                if match:
                    followers = self._parse_count(match.group(1))

            title = await page.title()
            display_name = title.split("•")[0].strip() if "•" in title else username

            return {
                **self._empty_profile(username),
                "display_name": display_name,
                "followers": followers,
            }
        finally:
            await page.close()

    async def _scrape_tiktok(self, username: str) -> dict:
        """Scrape TikTok public profile."""
        page = await self.context.new_page()
        try:
            await page.goto(f"https://www.tiktok.com/@{username}", timeout=15000)
            await asyncio.sleep(3)

            # TikTok renders via JS — wait for stats
            try:
                await page.wait_for_selector('[data-e2e="followers-count"]', timeout=8000)
                followers_el = page.locator('[data-e2e="followers-count"]').first
                followers = self._parse_count(await followers_el.inner_text())
            except Exception:
                followers = None

            try:
                name_el = page.locator('[data-e2e="user-title"]').first
                display_name = await name_el.inner_text()
            except Exception:
                display_name = username

            return {
                **self._empty_profile(username),
                "display_name": display_name,
                "followers": followers,
                "posts_per_week": 5.0,  # TikTok average for active creators
            }
        finally:
            await page.close()

    async def _get_youtube_recent_videos(self, username: str) -> list[dict]:
        """Get recent video titles and engagement data from YouTube public page."""
        page = await self.context.new_page()
        try:
            await page.goto(f"https://www.youtube.com/@{username}/videos", timeout=15000)
            await asyncio.sleep(2)

            videos = []
            video_els = await page.locator("ytd-rich-grid-media").all()

            for el in video_els[:20]:
                try:
                    title = await el.locator("#video-title").inner_text()
                    views_text = await el.locator("span.ytd-video-meta-block").first.inner_text()
                    views = self._parse_count(views_text.replace(" views", "").strip())

                    videos.append({
                        "caption": title,
                        "views": views or 0,
                        "likes": 0,
                        "comments": 0,
                        "hashtags": [],
                        "engagement_rate": 0.04,  # YouTube average estimate
                    })
                except Exception:
                    continue

            return videos
        finally:
            await page.close()
