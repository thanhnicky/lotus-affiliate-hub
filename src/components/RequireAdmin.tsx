import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

/** Chỉ cho phép tài khoản role="admin" vào các trang quản trị. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, affiliate, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      void navigate({ to: "/login", replace: true });
      return;
    }

    if (!affiliate || affiliate.role !== "admin") {
      void navigate({ to: "/dashboard", replace: true });
      return;
    }
  }, [isLoading, user, affiliate, navigate]);

  if (isLoading || !user || !affiliate || affiliate.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-soft">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
