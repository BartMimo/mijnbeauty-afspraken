-- Drop existing FK referencing profiles and recreate referencing public.users
ALTER TABLE public.salons DROP CONSTRAINT IF EXISTS salons_owner_id_fkey;
ALTER TABLE public.salons
  ADD CONSTRAINT salons_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);
