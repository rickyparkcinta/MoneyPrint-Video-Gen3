#!/usr/bin/env bash
set -euo pipefail

: "${GOOGLE_CLOUD_PROJECT_ID:?Set GOOGLE_CLOUD_PROJECT_ID}"
: "${GOOGLE_CLOUD_REGION:?Set GOOGLE_CLOUD_REGION}"

IMAGE="${GOOGLE_CLOUD_REGION}-docker.pkg.dev/${GOOGLE_CLOUD_PROJECT_ID}/moneyprint/worker:latest"

gcloud artifacts repositories create moneyprint \
  --repository-format=docker \
  --location="${GOOGLE_CLOUD_REGION}" \
  --project="${GOOGLE_CLOUD_PROJECT_ID}" || true

gcloud builds submit \
  --project="${GOOGLE_CLOUD_PROJECT_ID}" \
  --tag="${IMAGE}" \
  --file=services/worker/Dockerfile \
  .

gcloud run jobs deploy moneyprint-worker \
  --project="${GOOGLE_CLOUD_PROJECT_ID}" \
  --region="${GOOGLE_CLOUD_REGION}" \
  --image="${IMAGE}" \
  --cpu=2 \
  --memory=4Gi \
  --task-timeout=3600s \
  --set-env-vars=SUPABASE_STORAGE_BUCKET=videos
