"""
Transcription Service — OpenAI Whisper via API
Downloads media temporarily, transcribes, cleans up
"""
import os
import asyncio
import tempfile
import logging
from pathlib import Path
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MAX_FILE_SIZE_MB = 25  # Whisper API limit


class TranscriptionService:
    def __init__(self):
        self._client: AsyncOpenAI | None = None

    @property
    def client(self) -> AsyncOpenAI:
        if self._client is None:
            self._client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        return self._client

    async def transcribe(self, media_url: str, language: str = "en") -> str:
        """
        Download media from URL and transcribe using Whisper.
        Returns transcript text or empty string on failure.
        """
        if not media_url or not OPENAI_API_KEY:
            return ""

        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "audio.mp3"

            # Download with yt-dlp (handles TikTok, Instagram, YouTube, Facebook)
            success = await self._download_audio(media_url, str(output_path))
            if not success:
                return ""

            # Check file size
            file_size = output_path.stat().st_size / (1024 * 1024)
            if file_size > MAX_FILE_SIZE_MB:
                logger.warning(f"Audio file too large: {file_size:.1f}MB, skipping")
                return ""

            # Transcribe
            try:
                with open(output_path, "rb") as audio_file:
                    response = await self.client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language=language,
                        response_format="text",
                    )
                return str(response).strip()
            except Exception as e:
                logger.error(f"Whisper transcription failed: {e}")
                return ""

    async def _download_audio(self, url: str, output_path: str) -> bool:
        """Download audio from media URL using yt-dlp."""
        try:
            cmd = [
                "yt-dlp",
                "--extract-audio",
                "--audio-format", "mp3",
                "--audio-quality", "5",          # lower quality = smaller file
                "--max-filesize", "25m",
                "--no-playlist",
                "--quiet",
                "-o", output_path,
                url,
            ]
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            _, stderr = await asyncio.wait_for(proc.communicate(), timeout=60)

            if proc.returncode != 0:
                logger.debug(f"yt-dlp failed: {stderr.decode()[:200]}")
                return False

            return Path(output_path).exists()
        except asyncio.TimeoutError:
            logger.warning("yt-dlp download timed out")
            return False
        except Exception as e:
            logger.error(f"Download error: {e}")
            return False
