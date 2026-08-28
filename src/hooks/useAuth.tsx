import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { authService, profileService } from "@/services";
import type { AffiliateProfile, AuthSession } from "@/types";

export function useSession() {
  return useQuery<AuthSession | null>({
    queryKey: ["session"],
    queryFn: () => authService.getSession(),
    staleTime: 30_000,
  });
}

export function useProfile() {
  const { data: session, isLoading: sessionLoading } = useSession();
  const query = useQuery<AffiliateProfile | null>({
    queryKey: ["profile", session?.user_id],
    queryFn: () => profileService.getProfile(session!.user_id),
    enabled: Boolean(session?.user_id),
  });
  return { ...query, isLoading: sessionLoading || query.isLoading, session };
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useCallback(async () => {
    await authService.signOut();
    queryClient.clear();
    await navigate({ to: "/login", replace: true });
  }, [queryClient, navigate]);
}
