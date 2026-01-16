#!/usr/bin/env bash
set -euo pipefail

MIGRATIONS_DIR="$(dirname "$0")/migrations"

echo "Looking for SQL migration files in: $MIGRATIONS_DIR"

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Please install it and authenticate (https://supabase.com/docs/guides/cli)."
  echo "Alternatively, run the SQL files manually against your DB with psql or the Supabase SQL editor."
  exit 1
fi

for f in "$MIGRATIONS_DIR"/*.sql; do
  echo "Applying migration: $f"
  supabase db query --file "$f"
done

echo "All migrations applied (if supabase CLI is configured)."