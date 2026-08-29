import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

/** Chỉ cho phép CTV có trạng thái active vào các trang nghiệp vụ. */
export function RequireActive({ children }: { children: ReactNode }) {
  const { user, affiliate, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      void navigate({ to: "/login", replace: true });
      return;
    }

    if (!affiliate || affiliate.status === "pending") {
      void navigate({ to: "/pending", replace: true });
      return;
    }

    if (affiliate.status === "suspended") {
      void navigate({ to: "/suspended", replace: true });
      return;
    }
  }, [isLoading, user, affiliate, navigate]);

  if (isLoading || !user || !affiliate || affiliate.status !== "active") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-soft">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

export const ProtectedRoute = RequireActive;

