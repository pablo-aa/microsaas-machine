#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_PROJECT_REF_DEV:-}" ]]; then
  echo "[ERROR] SUPABASE_PROJECT_REF_DEV não definido. Exporte a variável antes de rodar."
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "[ERROR] Supabase CLI não encontrado. Instale com: npm i -g supabase"
  exit 1
fi

echo "→ Deploy de Edge Functions para DEV (ref: $SUPABASE_PROJECT_REF_DEV)"
for d in supabase/functions/*; do
  f="$(basename "$d")"
  echo "-- Deploy: $f"
  supabase functions deploy "$f" --project-ref "$SUPABASE_PROJECT_REF_DEV"
done

echo "✓ Deploy DEV concluído"