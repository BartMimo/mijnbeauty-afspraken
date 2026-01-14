# Supabase schema

This folder contains `init-schema.sql` — a script you can run in your Supabase project to create the minimal tables the app expects.

How to apply:

1. Go to https://app.supabase.com and open your project.
2. In the left nav choose **SQL** → **New query**.
3. Open `supabase/init-schema.sql` from this repo, paste it into the editor and run it.
4. After the script completes, re-run the importer in your project root, for example:

   ```bash
   npm run import-data -- --file ./data/salons.json --table salons
   ```

Mapping / importing into existing tables
- If your exported fields don't match your DB column names, you can provide a mapping file (JSON) where the keys are source fields and the values the target column names:

   ```json
   {
     "ownerId": "owner_id"
   }
   ```

- Example usage with mapping:

   ```bash
   npm run import-data -- --file ./data/salons.json --table salons --map ./data/mappings/salons.map.json
   ```

Notes:
- When importing, you may hit Row Level Security (RLS) errors like "new row violates row-level security policy for table \"salons\"". There are two safe ways to handle this:

  1. Temporarily provide your **Service Role Key** in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY` (only for import runs). This key bypasses RLS and allows imports. Keep it secret and remove it after import.

     Example `.env.local`:
     ```dotenv
     SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key...
     ```

     The importer will detect and use the service role key automatically if present.

  2. Or, create a temporary permissive policy in the Dashboard (SQL) to allow inserts, then remove/secure it after import. Example policy SQL:
     ```sql
     -- Allow public inserts (temporary) - use with caution
     CREATE POLICY allow_public_insert ON public.salons FOR INSERT USING (true) WITH CHECK (true);
     ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
     ```

- The provided schema uses UUID primary keys and requires the `pgcrypto` extension. If you see errors about UUID vs text (e.g. "incompatible types: text and uuid"), run the SQL in `supabase/init-schema.sql` which includes `CREATE EXTENSION IF NOT EXISTS pgcrypto;`.
- If your existing tables already used text IDs, you may need to convert columns (if the values are valid UUID strings):

  ```sql
  ALTER TABLE public.salons ALTER COLUMN id TYPE uuid USING id::uuid;
  ALTER TABLE public.services ALTER COLUMN salon_id TYPE uuid USING salon_id::uuid;
  ```

- Migrations: `supabase/migrations/0001_init.sql` is included as a first migration. If you'd like to use the Supabase CLI for migrations, install and run `supabase login` then `supabase db push` or use the CLI to apply migrations.

- Owner linking: run `supabase/add-owner-users.sql` in the Dashboard SQL editor to create users for salons missing `owner_id` and link them. If you want me to run it automatically, temporarily add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and say `run owner-link`, and I'll execute it on your behalf.

