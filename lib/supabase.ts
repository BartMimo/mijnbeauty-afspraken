import { createClient } from '@supabase/supabase-js';

// Gebruik import.meta.env voor Vite projecten
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

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