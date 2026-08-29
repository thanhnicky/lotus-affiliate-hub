import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import type { Affiliate } from "@/types/affiliate";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  affiliate: Affiliate | null;
  isLoading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<Affiliate | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  const fetchAffiliateProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: fetchErr } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchErr) {
        console.error("Lỗi khi tải thông tin affiliate:", fetchErr);
        const err = new Error(fetchErr.message || "Không thể tải hồ sơ cộng tác viên.");
        setError(err);
        return null;
      }

      setAffiliate(data as Affiliate | null);
      setError(null);
      return data as Affiliate | null;
    } catch (err: any) {
      console.error("Lỗi khi lấy thông tin affiliate:", err);
      const errorObj = err instanceof Error ? err : new Error(err?.message || "Lỗi hệ thống");
      setError(errorObj);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setAffiliate(null);
      return null;
    }
    return await fetchAffiliateProfile(user.id);
  }, [user, fetchAffiliateProfile]);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        setIsLoading(true);
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            await fetchAffiliateProfile(currentSession.user.id);
          } else {
            setAffiliate(null);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Lỗi khởi tạo phiên đăng nhập:", err);
          setError(
            err instanceof Error ? err : new Error(err?.message || "Lỗi khởi tạo phiên đăng nhập.")
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchAffiliateProfile(currentSession.user.id);
      } else {
        setAffiliate(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchAffiliateProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      setAffiliate(null);
      queryClient.clear();
    }
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        affiliate,
        isLoading,
        error,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider.");
  }
  return context;
}

export function useSession() {
  const { session, user, isLoading } = useAuth();
  return {
    data: session
      ? {
          user_id: user?.id ?? "",
          email: user?.email ?? "",
        }
      : null,
    isLoading,
  };
}

export function useProfile() {
  const { affiliate, user, isLoading, error, refreshProfile } = useAuth();
  return {
    data: affiliate,
    isLoading,
    isError: Boolean(error),
    error,
    refetch: refreshProfile,
    session: user ? { user_id: user.id, email: user.email ?? "" } : null,
    affiliate,
    user,
  };
}

export function useSignOut() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return useCallback(async () => {
    await signOut();
    await navigate({ to: "/login", replace: true });
  }, [signOut, navigate]);
}

