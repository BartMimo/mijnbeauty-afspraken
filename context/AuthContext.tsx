import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Loader2, AlertTriangle } from 'lucide-react';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isDemoMode: false,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const normalizeRole = (rawRole: unknown) => {
    const role = (rawRole ?? 'user').toString().trim().toLowerCase();
    if (role.includes('admin')) return 'admin';
    if (role.includes('salon') || role.includes('owner')) return 'salon';
    if (role.includes('staff')) return 'staff';
    return 'user';
  };
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkKeys = () => {
        const url = (import.meta as any).env?.VITE_SUPABASE_URL;
        return !!url;
    };

    const initAuth = async () => {
      if (!checkKeys()) {
        if (mounted) {
          setIsDemoMode(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(
              session.user.id,
              session.user.user_metadata?.role,
              session.user.user_metadata?.full_name,
              session.user.email
            );
          } else {
            setIsLoading(false);
          }
        }
      } catch (e) {
        console.error("Auth init failed", e);
        if (mounted) {
            setIsDemoMode(true);
            setIsLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(
            session.user.id,
            session.user.user_metadata?.role,
            session.user.user_metadata?.full_name,
            session.user.email
          );
        }
        else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, roleMeta?: string, fullNameMeta?: string, emailMeta?: string) => {
    const normalizedEmail = emailMeta?.toLowerCase().trim();
    
    try {
      // HARDCODED ADMIN CHECK - admin@bart.nl is ALTIJD admin
      if (normalizedEmail === 'admin@bart.nl') {
        setProfile({
          id: userId,
          role: 'admin',
          full_name: fullNameMeta || 'Admin',
          email: normalizedEmail
        });
        setIsLoading(false);
        return;
      }

      // Try to get profile by auth user ID
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (!error && data) {
        const finalRole = normalizeRole(data.role || roleMeta);
        setProfile({
          ...data,
          role: finalRole,
          full_name: data.full_name || fullNameMeta || null,
          email: data.email || normalizedEmail || null
        });
        setIsLoading(false);
        return;
      }

      // Profile not found - use metadata
      const finalRole = normalizeRole(roleMeta || 'user');

      // Try to create profile
      try {
        await supabase.from('profiles').insert({
          id: userId,
          email: normalizedEmail || '',
          role: finalRole === 'user' ? 'user' : finalRole,
          full_name: fullNameMeta || null
        });
      } catch (insertErr) {
        // Ignore insert errors
      }

      setProfile({
        id: userId,
        role: finalRole,
        full_name: fullNameMeta || null,
        email: normalizedEmail || null
      });
      
    } catch (e) {
      // FALLBACK: Check email for admin
      if (normalizedEmail === 'admin@bart.nl') {
        setProfile({
          id: userId,
          role: 'admin',
          full_name: fullNameMeta || 'Admin',
          email: normalizedEmail
        });
      } else {
        setProfile({
          id: userId,
          role: normalizeRole(roleMeta || 'user'),
          full_name: fullNameMeta || null,
          email: normalizedEmail || null
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear all localStorage that might contain old demo/test data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userAppointments');
    localStorage.removeItem('user_favorites');
    localStorage.removeItem('salon_deals');
    localStorage.removeItem('salon_appointments');
    localStorage.removeItem('salon_services');
    localStorage.removeItem('salon_settings');
    localStorage.removeItem('salon_staff_v2');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="h-10 w-10 text-brand-400 animate-spin" />
        <p className="mt-4 text-stone-500 font-medium">Site opstarten...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, isDemoMode, signOut }}>
      {isDemoMode && (
        <div className="bg-amber-50 text-amber-800 text-xs py-1 text-center border-b border-amber-100 flex items-center justify-center gap-2">
          <AlertTriangle size={12} />
          Demo Modus: Koppel Supabase via .env om inloggen te activeren.
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);