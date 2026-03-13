import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AuthActionError = { message: string } | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthActionError }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthActionError }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) return { error: { message: "Backend not configured" } };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? { message: error.message } : null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (!isSupabaseConfigured || !supabase) return { error: { message: "Backend not configured" } };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error ? { message: error.message } : null };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
