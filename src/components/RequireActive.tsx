import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { useProfile } from "@/lib/session";

export function RequireActive({ children }: { children: ReactNode }) {
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && profile && profile.status !== "active") {
      void navigate({ to: "/pending", replace: true });
    }
  }, [isLoading, profile, navigate]);

  if (isLoading || !profile || profile.status !== "active") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-soft">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
