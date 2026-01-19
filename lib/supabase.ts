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

/**
 * Safe helper to fetch staff for a salon.
 * Some older DBs may not have the `is_active` column — try the strict query first
 * and fall back to a permissive query if the column is missing.
 */
export async function fetchStaffForSalon(salonId: string) {
  if (!salonId) return [];
  // First: attempt to request the newer schema (with is_active)
  try {
    const { data, error } = await (supabase as any)
      .from('staff')
      .select(`
        id,
        salon_id,
        user_id,
        name,
        email,
        phone,
        role,
        is_active,
        service_staff(service_id)
      `)
      .eq('salon_id', salonId)
      .eq('is_active', true);

    if (!error) return data || [];

    // If error is not a missing-column error, rethrow to let caller handle it
    if (!/does not exist|42703/i.test(error.message || error.code || '')) {
      console.warn('fetchStaffForSalon unexpected error:', error);
      return [];
    }
  } catch (err) {
    // continue to fallback
  }

  // Fallback: older schema without is_active
  try {
    const { data, error } = await (supabase as any)
      .from('staff')
      .select(`
        id,
        salon_id,
        user_id,
        name,
        email,
        phone,
        role,
        service_staff(service_id)
      `)
      .eq('salon_id', salonId);

    if (error) {
      console.warn('fetchStaffForSalon fallback error:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('fetchStaffForSalon final error:', err);
    return [];
  }
}