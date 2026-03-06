FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# yt-dlp binary
RUN curl -sSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/bin/yt-dlp && chmod +x /usr/bin/yt-dlp

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /mnt/deezer-downloader/songs \
             /mnt/deezer-downloader/albums \
             /mnt/deezer-downloader/youtube-dl \
             /data

ENV PYTHONUNBUFFERED=1
ENV DEEZER_CONFIG=/app/deezer-downloader.ini

EXPOSE 5000

CMD ["python", "-m", "deezer_downloader.runner"]
