FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MONEYPRINTER_HOME=/app/moneyprinter

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg imagemagick git curl ca-certificates fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

COPY services/worker/moneyprinter/requirements.txt /app/moneyprinter/requirements.txt
RUN pip install --no-cache-dir -r /app/moneyprinter/requirements.txt

COPY services/worker/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY services/worker/moneyprinter /app/moneyprinter
COPY services/worker/worker /app/worker

WORKDIR /app

CMD ["sh", "-c", "uvicorn worker.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
