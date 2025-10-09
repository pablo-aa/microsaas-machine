#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_PROJECT_REF_PROD:-}" ]]; then
  echo "[ERROR] SUPABASE_PROJECT_REF_PROD não definido. Exporte a variável antes de rodar."
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "[ERROR] Supabase CLI não encontrado. Instale com: npm i -g supabase"
  exit 1
fi

echo "→ Deploy de Edge Functions para PROD (ref: $SUPABASE_PROJECT_REF_PROD)"
for d in supabase/functions/*; do
  f="$(basename "$d")"
  echo "-- Deploy: $f"
  supabase functions deploy "$f" --project-ref "$SUPABASE_PROJECT_REF_PROD"
done

echo "✓ Deploy PROD concluído"