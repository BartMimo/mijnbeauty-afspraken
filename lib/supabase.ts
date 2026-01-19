import { createClient } from '@supabase/supabase-js';

// Gebruik import.meta.env voor Vite projecten, maar fallback naar productie waarden
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://yufuecwkihuesctddawe.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1ZnVlY3draWh1ZXNjdGRkYXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQzODEsImV4cCI6MjA4Mzk2MDM4MX0.W5HLhFIHHkLDvXzx-usUBJGFpHR54gyfNkxs36HnY8g';

// We maken de client alleen aan als de URL geldig is, anders geven we een dummy object
// om crashes te voorkomen in Demo Modus.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: { message: 'Geen database verbinding' } }),
        signOut: async () => {}
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        insert: async () => ({ error: null })
      })
    } as any;