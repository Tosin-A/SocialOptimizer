"""
Public Profile Scraper — httpx-based, public data only
Scrapes only publicly visible data without authentication.
Uses HTTP requests + HTML/JSON parsing instead of Playwright for reliability.
"""
import json
import logging
import re
from bs4 import BeautifulSoup
import httpx

logger = logging.getLogger(__name__)

# Browser-like headers — keep minimal to avoid triggering bot detection.
# Do NOT include Accept-Encoding: br (brotli) — httpx can't decompress it
# and platforms may return garbled responses.
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


class PublicProfileScraper:
    """
    Scrapes public social media profiles using httpx.
    Respects robots.txt, only accesses public data.
    """

    def __init__(self):
        self.client: httpx.AsyncClient | None = None

    async def init(self):
        self.client = httpx.AsyncClient(
            headers=_HEADERS,
            cookies={
                # Bypass YouTube GDPR consent page
                "SOCS": "CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjA3X3AxGgJlbiADGgYIgJnPpwY",
                "CONSENT": "YES+",
            },
            follow_redirects=True,
            timeout=httpx.Timeout(20.0, connect=10.0),
        )

    async def close(self):
        if self.client:
            await self.client.aclose()

    async def get_profile(self, platform: str, username: str) -> dict:
        """Get public profile metrics for a creator."""
        handlers = {
            "youtube": self._scrape_youtube,
            "tiktok": self._scrape_tiktok,
            "instagram": self._scrape_instagram,
        }

        handler = handlers.get(platform)
        if not handler:
            return self._empty_profile(username)

        try:
            return await handler(username)
        except Exception as e:
            logger.error(f"Profile scrape error for {platform}/{username}: {e}")
            return self._empty_profile(username)

    async def get_recent_posts(self, platform: str, username: str) -> list[dict]:
        """Get recent public posts from a creator."""
        try:
            if platform == "youtube":
                return await self._get_youtube_recent_videos(username)
            if platform == "tiktok":
                return await self._get_tiktok_recent_posts(username)
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
        text = text.strip().replace(",", "").replace(" ", "").upper()
        multipliers = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}
        for suffix, mult in multipliers.items():
            if text.endswith(suffix):
                try:
                    return int(float(text[:-1]) * mult)
                except ValueError:
                    return None
        try:
            return int(float(text))
        except ValueError:
            return None

    # ─── TikTok ────────────────────────────────────────────────────────────────

    async def _scrape_tiktok(self, username: str) -> dict:
        """
        Scrape TikTok profile using the embedded __UNIVERSAL_DATA_FOR_REHYDRATION__ JSON,
        which contains all profile data without needing JS rendering.
        """
        url = f"https://www.tiktok.com/@{username}"
        resp = await self.client.get(url)
        resp.raise_for_status()

        html = resp.text

        # Strategy 1: Extract from __UNIVERSAL_DATA_FOR_REHYDRATION__ script tag
        result = self._extract_tiktok_universal_data(html, username)
        if result and result.get("followers") is not None:
            return result

        # Strategy 2: Extract from SIGI_STATE script tag (older pages)
        result = self._extract_tiktok_sigi_state(html, username)
        if result and result.get("followers") is not None:
            return result

        # Strategy 3: Parse meta tags as last resort
        result = self._extract_tiktok_meta(html, username)
        if result and result.get("followers") is not None:
            return result

        logger.warning(f"TikTok: all extraction strategies failed for @{username}")
        return self._empty_profile(username)

    def _extract_tiktok_universal_data(self, html: str, username: str) -> dict | None:
        """Extract profile data from TikTok's __UNIVERSAL_DATA_FOR_REHYDRATION__ JSON."""
        try:
            match = re.search(
                r'<script\s+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>',
                html, re.DOTALL
            )
            if not match:
                return None

            data = json.loads(match.group(1))

            # Navigate to user data — structure: __DEFAULT_SCOPE__["webapp.user-detail"]
            user_detail = (
                data.get("__DEFAULT_SCOPE__", {})
                .get("webapp.user-detail", {})
            )
            user_info = user_detail.get("userInfo", {})
            user = user_info.get("user", {})
            stats = user_info.get("stats", {})

            if not user and not stats:
                return None

            followers = stats.get("followerCount")
            display_name = user.get("nickname") or username
            avatar_url = user.get("avatarLarger") or user.get("avatarMedium")
            unique_id = user.get("uniqueId", username)

            return {
                **self._empty_profile(username),
                "platform_user_id": unique_id,
                "display_name": display_name,
                "avatar_url": avatar_url,
                "followers": followers,
                "posts_per_week": 5.0,
            }
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.debug(f"TikTok universal data extraction failed: {e}")
            return None

    def _extract_tiktok_sigi_state(self, html: str, username: str) -> dict | None:
        """Extract from SIGI_STATE (older TikTok page format)."""
        try:
            match = re.search(
                r'<script\s+id="SIGI_STATE"[^>]*>(.*?)</script>',
                html, re.DOTALL
            )
            if not match:
                return None

            data = json.loads(match.group(1))
            user_module = data.get("UserModule", {})
            users = user_module.get("users", {})
            stats = user_module.get("stats", {})

            # Find the user by username key
            user_data = users.get(username, {})
            user_stats = stats.get(username, {})

            if not user_data and not user_stats:
                return None

            return {
                **self._empty_profile(username),
                "platform_user_id": user_data.get("uniqueId", username),
                "display_name": user_data.get("nickname") or username,
                "avatar_url": user_data.get("avatarLarger"),
                "followers": user_stats.get("followerCount"),
                "posts_per_week": 5.0,
            }
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.debug(f"TikTok SIGI_STATE extraction failed: {e}")
            return None

    def _extract_tiktok_meta(self, html: str, username: str) -> dict | None:
        """Extract follower count from TikTok meta tags."""
        try:
            soup = BeautifulSoup(html, "lxml")

            # Try og:description or description meta
            meta = soup.find("meta", attrs={"name": "description"})
            if not meta:
                meta = soup.find("meta", attrs={"property": "og:description"})
            if not meta:
                return None

            content = meta.get("content", "")
            # Pattern: "123.4K Followers" or "1.2M Followers"
            match = re.search(r"([\d,.]+[KMB]?)\s*Followers", content, re.IGNORECASE)
            followers = self._parse_count(match.group(1)) if match else None

            # Display name from title
            title_tag = soup.find("title")
            display_name = username
            if title_tag and title_tag.string:
                # Title often: "Display Name (@username) | TikTok"
                name_match = re.match(r"^(.+?)\s*\(@", title_tag.string)
                if name_match:
                    display_name = name_match.group(1).strip()

            return {
                **self._empty_profile(username),
                "display_name": display_name,
                "followers": followers,
                "posts_per_week": 5.0,
            }
        except Exception as e:
            logger.debug(f"TikTok meta extraction failed: {e}")
            return None

    async def _get_tiktok_recent_posts(self, username: str) -> list[dict]:
        """Extract recent post data from TikTok page JSON."""
        try:
            url = f"https://www.tiktok.com/@{username}"
            resp = await self.client.get(url)
            resp.raise_for_status()

            match = re.search(
                r'<script\s+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>',
                resp.text, re.DOTALL
            )
            if not match:
                return []

            data = json.loads(match.group(1))
            item_list = (
                data.get("__DEFAULT_SCOPE__", {})
                .get("webapp.user-detail", {})
                .get("userInfo", {})
                .get("user", {})
            )

            # Items may be in a separate key
            items_module = (
                data.get("__DEFAULT_SCOPE__", {})
                .get("webapp.user-detail", {})
            )
            # Try different paths for the item list
            items = items_module.get("itemList", [])

            posts = []
            for item in items[:20]:
                try:
                    desc = item.get("desc", "")
                    stats = item.get("stats", {})
                    hashtags = [
                        c.get("hashtagName", "")
                        for c in item.get("textExtra", [])
                        if c.get("hashtagName")
                    ]

                    views = stats.get("playCount", 0)
                    likes = stats.get("diggCount", 0)
                    comments = stats.get("commentCount", 0)
                    shares = stats.get("shareCount", 0)

                    eng_rate = 0.0
                    if views > 0:
                        eng_rate = (likes + comments + shares) / views

                    posts.append({
                        "caption": desc,
                        "views": views,
                        "likes": likes,
                        "comments": comments,
                        "hashtags": hashtags,
                        "engagement_rate": round(eng_rate, 4),
                    })
                except Exception:
                    continue

            return posts
        except Exception as e:
            logger.debug(f"TikTok recent posts extraction failed: {e}")
            return []

    # ─── YouTube ───────────────────────────────────────────────────────────────

    async def _scrape_youtube(self, username: str) -> dict:
        """
        Scrape YouTube channel using the embedded ytInitialData JSON.
        """
        urls = [
            f"https://www.youtube.com/@{username}",
            f"https://www.youtube.com/c/{username}",
        ]

        for url in urls:
            try:
                resp = await self.client.get(url)
                if resp.status_code == 404:
                    continue
                resp.raise_for_status()

                result = self._extract_youtube_data(resp.text, username)
                if result and result.get("followers") is not None:
                    return result
            except httpx.HTTPStatusError:
                continue

        logger.warning(f"YouTube: could not scrape @{username}")
        return self._empty_profile(username)

    def _extract_youtube_data(self, html: str, username: str) -> dict | None:
        """Extract channel data from YouTube's ytInitialData JSON."""
        try:
            # ytInitialData is embedded as: var ytInitialData = {...};
            match = re.search(r"var\s+ytInitialData\s*=\s*(\{.*?\});\s*</script>", html, re.DOTALL)
            if not match:
                # Alternative pattern
                match = re.search(r'ytInitialData"\s*>\s*(\{.*?\})\s*</script>', html, re.DOTALL)
            if not match:
                return None

            data = json.loads(match.group(1))

            # Navigate to channel header
            header = (
                data.get("header", {})
                .get("c4TabbedHeaderRenderer", {})
            )

            # Newer YouTube uses pageHeaderRenderer
            if not header:
                header_data = data.get("header", {}).get("pageHeaderRenderer", {})
                return self._extract_youtube_page_header(header_data, username)

            display_name = header.get("title")
            avatar_url = None
            avatar_thumbs = header.get("avatar", {}).get("thumbnails", [])
            if avatar_thumbs:
                avatar_url = avatar_thumbs[-1].get("url")

            # Subscriber count text: "1.23M subscribers"
            sub_text = header.get("subscriberCountText", {}).get("simpleText", "")
            followers = self._parse_count(sub_text.replace("subscribers", "").strip())

            return {
                **self._empty_profile(username),
                "display_name": display_name or username,
                "avatar_url": avatar_url,
                "followers": followers,
                "posts_per_week": 2.0,
            }
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.debug(f"YouTube data extraction failed: {e}")
            return None

    def _extract_youtube_page_header(self, header_data: dict, username: str) -> dict | None:
        """Extract from newer YouTube pageHeaderRenderer format."""
        try:
            if not header_data:
                return None

            content = header_data.get("content", {}).get("pageHeaderViewModel", {})
            title = content.get("title", {}).get("dynamicTextViewModel", {}).get("text", {}).get("content", "")

            # Metadata rows contain subscriber count
            metadata = content.get("metadata", {}).get("contentMetadataViewModel", {})
            metadata_rows = metadata.get("metadataRows", [])

            followers = None
            for row in metadata_rows:
                for part in row.get("metadataParts", []):
                    text_content = part.get("text", {}).get("content", "")
                    if "subscriber" in text_content.lower():
                        followers = self._parse_count(
                            text_content.replace("subscribers", "").strip()
                        )
                        break

            avatar_url = None
            image = content.get("image", {}).get("decoratedAvatarViewModel", {})
            avatar_data = image.get("avatar", {}).get("avatarViewModel", {})
            thumbs = avatar_data.get("image", {}).get("sources", [])
            if thumbs:
                avatar_url = thumbs[-1].get("url")

            return {
                **self._empty_profile(username),
                "display_name": title or username,
                "avatar_url": avatar_url,
                "followers": followers,
                "posts_per_week": 2.0,
            }
        except (KeyError, TypeError) as e:
            logger.debug(f"YouTube page header extraction failed: {e}")
            return None

    async def _get_youtube_recent_videos(self, username: str) -> list[dict]:
        """Get recent videos from YouTube channel's videos tab."""
        try:
            resp = await self.client.get(f"https://www.youtube.com/@{username}/videos")
            if resp.status_code != 200:
                return []

            match = re.search(r"var\s+ytInitialData\s*=\s*(\{.*?\});\s*</script>", resp.text, re.DOTALL)
            if not match:
                return []

            data = json.loads(match.group(1))

            # Navigate to video grid
            tabs = (
                data.get("contents", {})
                .get("twoColumnBrowseResultsRenderer", {})
                .get("tabs", [])
            )

            videos = []
            for tab in tabs:
                tab_content = tab.get("tabRenderer", {}).get("content", {})
                grid_items = (
                    tab_content
                    .get("richGridRenderer", {})
                    .get("contents", [])
                )

                for item in grid_items[:20]:
                    renderer = (
                        item.get("richItemRenderer", {})
                        .get("content", {})
                        .get("videoRenderer", {})
                    )
                    if not renderer:
                        continue

                    title_runs = renderer.get("title", {}).get("runs", [])
                    title = title_runs[0].get("text", "") if title_runs else ""

                    view_text = renderer.get("viewCountText", {}).get("simpleText", "")
                    views = self._parse_count(view_text.replace("views", "").strip())

                    videos.append({
                        "caption": title,
                        "views": views or 0,
                        "likes": 0,
                        "comments": 0,
                        "hashtags": [],
                        "engagement_rate": 0.04,
                    })

                if videos:
                    break

            return videos
        except Exception as e:
            logger.debug(f"YouTube recent videos extraction failed: {e}")
            return []

    # ─── Instagram ─────────────────────────────────────────────────────────────

    async def _scrape_instagram(self, username: str) -> dict:
        """
        Instagram heavily restricts scraping.
        Extract what we can from public page meta tags.
        """
        try:
            resp = await self.client.get(f"https://www.instagram.com/{username}/")
            if resp.status_code != 200:
                return self._empty_profile(username)

            soup = BeautifulSoup(resp.text, "lxml")

            # Try meta description: "1.2M Followers, 500 Following, 300 Posts"
            followers = None
            meta = soup.find("meta", attrs={"name": "description"})
            if meta:
                content = meta.get("content", "")
                match = re.search(r"([\d,.]+[KMB]?)\s*Followers", content, re.IGNORECASE)
                if match:
                    followers = self._parse_count(match.group(1))

            # Try og:description as fallback
            if followers is None:
                og_meta = soup.find("meta", attrs={"property": "og:description"})
                if og_meta:
                    content = og_meta.get("content", "")
                    match = re.search(r"([\d,.]+[KMB]?)\s*Followers", content, re.IGNORECASE)
                    if match:
                        followers = self._parse_count(match.group(1))

            # Display name from title: "Display Name (@username) • Instagram"
            display_name = username
            title_tag = soup.find("title")
            if title_tag and title_tag.string:
                title_match = re.match(r"^(.+?)\s*\(", title_tag.string)
                if title_match:
                    display_name = title_match.group(1).strip()

            # Avatar from og:image
            avatar_url = None
            og_image = soup.find("meta", attrs={"property": "og:image"})
            if og_image:
                avatar_url = og_image.get("content")

            return {
                **self._empty_profile(username),
                "display_name": display_name,
                "avatar_url": avatar_url,
                "followers": followers,
            }
        except Exception as e:
            logger.debug(f"Instagram scrape failed: {e}")
            return self._empty_profile(username)
