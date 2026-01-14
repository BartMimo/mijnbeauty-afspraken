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
            await fetchProfile(session.user.id);
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
        if (session?.user) fetchProfile(session.user.id);
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

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) {
        console.warn("Profile fetch error:", error);
      } else if (data) {
        setProfile(data);
      }
    } catch (e) {
      console.warn("Profile fetch failed:", e);
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