FROM python:3.12-slim

# ffmpeg is needed for audio transcription (yt-dlp)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# Install torch CPU-only first (~200MB vs ~4GB CUDA version).
# Use constraints file to prevent pip from replacing it with CUDA torch
# when resolving sentence-transformers dependencies.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip freeze | grep -i "^torch==" > /tmp/torch-constraint.txt && \
    pip install --no-cache-dir -r requirements.txt -c /tmp/torch-constraint.txt

COPY . .

EXPOSE 8000

# Railway sets $PORT dynamically; fall back to 8000 for local dev
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
