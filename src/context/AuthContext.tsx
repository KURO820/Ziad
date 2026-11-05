import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  needsProfileCompletion: boolean;
  signUp: (email: string, password: string, role: UserRole, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: string | null }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  completeProfile: (role: UserRole, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      setNeedsProfileCompletion(true);
      return null;
    }

    const p = data as Profile | null;
    setProfile(p);

    if (!p) {
      setNeedsProfileCompletion(true);
    } else {
      setNeedsProfileCompletion(false);
    }

    return p;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        (async () => {
          await fetchProfile(s.user.id);
        })();
      } else {
        setProfile(null);
        setNeedsProfileCompletion(false);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(
    async (email: string, password: string, role: UserRole, fullName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role, full_name: fullName },
        },
      });

      if (error) return { error: error.message };

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          role,
          full_name: fullName,
        });

        if (profileError) {
          return { error: profileError.message };
        }

        await fetchProfile(data.user.id);
      }

      return { error: null };
    },
    [fetchProfile]
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      await fetchProfile(data.user.id);
    }

    return { error: null };
  }, [fetchProfile]);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = `${window.location.origin}/#/login`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signInWithPhone = useCallback(async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms',
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) return { error: error.message };

    if (data.user) {
      await fetchProfile(data.user.id);
    }

    return { error: null };
  }, [fetchProfile]);

  const completeProfile = useCallback(
    async (role: UserRole, fullName: string) => {
      if (!session?.user) return { error: 'Not authenticated' };

      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('profiles')
          .update({ role, full_name: fullName })
          .eq('id', session.user.id);
        if (error) return { error: error.message };
      } else {
        const { error } = await supabase.from('profiles').insert({
          id: session.user.id,
          role,
          full_name: fullName,
        });
        if (error) return { error: error.message };
      }

      await fetchProfile(session.user.id);
      return { error: null };
    },
    [session, fetchProfile]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setNeedsProfileCompletion(false);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        needsProfileCompletion,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithPhone,
        verifyPhoneOtp,
        completeProfile,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
