This folder contains SQL migrations that modify the database schema.

How to apply:
1. Install and authenticate the Supabase CLI: https://supabase.com/docs/guides/cli
2. Run: `./scripts/run-migrations.sh`

If you prefer, you can copy & paste the SQL from each `.sql` file into the Supabase SQL editor in the dashboard or run with `psql` against your database.

What this migration does:
- Adds `phone` (TEXT) and `allow_contact_email` (BOOLEAN, default false) to `profiles`
- Adds `status` (TEXT, default 'active') to `deals` and backfills existing rows to 'active'
- Adds an index on `deals(salon_id, status)` for faster queries

Note: The script safely uses `IF NOT EXISTS` so it is idempotent and can be run multiple times.
