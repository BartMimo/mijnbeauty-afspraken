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
    try {
      // First try to get profile by auth user ID (correct approach)
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (!error && data) {
        const finalRole = normalizeRole(data.role || roleMeta);
        console.log('Profile found by ID:', { userId, role: finalRole, email: data.email });
        setProfile({
          ...data,
          role: finalRole,
          full_name: data.full_name || fullNameMeta || null,
          email: data.email || emailMeta || null
        });
        setIsLoading(false);
        return;
      }

      // Profile not found by ID - try by email (ID mismatch case)
      console.warn('Profile not found by ID, trying email lookup for:', emailMeta);
      
      if (emailMeta) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailMeta)
          .maybeSingle();
        
        if (profileByEmail) {
          // Found profile by email but ID doesn't match - use the role from this profile
          const finalRole = normalizeRole(profileByEmail.role || roleMeta);
          console.log('Profile found by email (ID mismatch):', { 
            authUserId: userId, 
            profileId: profileByEmail.id, 
            role: finalRole 
          });
          
          // Create/update profile with correct auth user ID
          try {
            await supabase.from('profiles').upsert({
              id: userId,
              email: emailMeta,
              role: profileByEmail.role || 'user',
              full_name: profileByEmail.full_name || fullNameMeta
            }, { onConflict: 'id' });
          } catch (upsertErr) {
            console.warn('Could not sync profile ID:', upsertErr);
          }
          
          setProfile({
            id: userId,
            role: finalRole,
            full_name: profileByEmail.full_name || fullNameMeta || null,
            email: emailMeta
          });
          setIsLoading(false);
          return;
        }
      }

      // No profile found at all - create default
      console.log('No profile found, creating default user profile');
      setProfile({
        id: userId,
        role: normalizeRole(roleMeta || 'user'),
        full_name: fullNameMeta || null,
        email: emailMeta || null
      });
      
    } catch (e) {
      console.warn("Profile fetch failed:", e);
      // Set default profile to prevent infinite loading
      setProfile({
        id: userId,
        role: normalizeRole(roleMeta || 'user'),
        full_name: fullNameMeta || null,
        email: emailMeta || null
      });
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