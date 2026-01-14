Supabase CLI (local setup)

1. Install the Supabase CLI (choose one):
   - Homebrew (macOS):
     brew install supabase/tap/supabase
   - npm (if you prefer):
     npm i -g supabase

2. Login and link:
   supabase login
   supabase link --project-ref <your-project-ref>

3. Apply migrations (push current database state):
   supabase db push

4. Create a new migration:
   supabase migration new <name>

Notes:
- Migrations are stored in `supabase/migrations/` (a sample `0001_init.sql` is included).
- You need to run `supabase login` interactively; I cannot run it for you with your credentials.
