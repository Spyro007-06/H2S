#!/usr/bin/env bash
# Deploy the backend to Cloud Run. The Gemini key comes from Secret Manager, never from the image.
#
# One-time setup:
#   gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com
#   printf '%s' "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
#   gcloud firestore databases create --location="$REGION"     # only if STORE=firestore
#
# Usage:
#   PROJECT=my-project REGION=asia-south1 CORS_ORIGIN=https://my-app.web.app bash scripts/deploy.sh
set -euo pipefail

: "${PROJECT:?set PROJECT}"
REGION="${REGION:-asia-south1}"
SERVICE="${SERVICE:-unbluff-api}"
GEMINI_MODEL="${GEMINI_MODEL:-gemini-3.6-flash}"
GEMINI_FALLBACK_MODEL="${GEMINI_FALLBACK_MODEL:-gemini-3.1-flash-lite}"
CORS_ORIGIN="${CORS_ORIGIN:-*}"
STORE="${STORE:-firestore}"

cd "$(dirname "${BASH_SOURCE[0]}")/.."

gcloud run deploy "$SERVICE" \
  --project "$PROJECT" \
  --region "$REGION" \
  --source . \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --concurrency 40 \
  --timeout 60 \
  --set-env-vars "LLM_MODE=live,GEMINI_MODEL=${GEMINI_MODEL},GEMINI_FALLBACK_MODEL=${GEMINI_FALLBACK_MODEL},CORS_ORIGIN=${CORS_ORIGIN},STORE=${STORE}" \
  --set-secrets "GEMINI_API_KEY=gemini-api-key:latest"

gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format 'value(status.url)'
