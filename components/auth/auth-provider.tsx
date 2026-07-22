"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfigError } from "@/lib/supabase/env";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  configError: string | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  initialUser: User | null;
};

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const configError = getSupabaseConfigError();
  const isConfigured = configError === null;

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isConfigured,
      configError,
    }),
    [user, isLoading, isConfigured, configError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
