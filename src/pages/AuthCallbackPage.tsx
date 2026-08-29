import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Đang xác thực tài khoản và xử lý kích hoạt...");

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      try {
        if (typeof window === "undefined") return;

        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (error) {
          throw new Error(errorDescription || "Liên kết xác thực không hợp lệ hoặc đã hết hạn.");
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw userError || new Error("Không thể tìm thấy phiên đăng nhập người dùng.");
        }

        if (user.email_confirmed_at) {
          if (!isMounted) return;
          setState("success");
          setMessage("Email đã được xác thực. Tài khoản CTV đang được kích hoạt...");

          await refreshProfile();

          toast.success("Xác thực email thành công!", {
            description: "Tài khoản của bạn đã được kích hoạt.",
          });

          setTimeout(() => {
            if (isMounted) {
              void navigate({ to: "/dashboard" });
            }
          }, 1500);
        } else {
          if (!isMounted) return;
          setState("error");
          setMessage("Tài khoản chưa được xác nhận email. Vui lòng thử lại.");
          toast.error("Chưa hoàn tất xác thực email");
        }
      } catch (err) {
        if (!isMounted) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi xác thực tài khoản.";
        setState("error");
        setMessage(msg);
        toast.error("Xác thực không thành công", { description: msg });
      }
    }

    void handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, refreshProfile]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-soft px-4 py-12">
      <AuthCard
        title={
          state === "loading"
            ? "Đang xác thực..."
            : state === "success"
              ? "Xác thực thành công!"
              : "Xác thực thất bại"
        }
        subtitle="Lotus Affiliate Portal"
      >
        <div className="space-y-4 text-center">
          {state === "loading" && (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {state === "success" && (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          )}

          {state === "error" && (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <XCircle className="h-8 w-8" />
            </div>
          )}

          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>

          {state === "error" && (
            <div className="pt-2">
              <Button
                className="h-12 w-full"
                onClick={() => void navigate({ to: "/login" })}
              >
                Về trang đăng nhập
              </Button>
            </div>
          )}
        </div>
      </AuthCard>
    </div>
  );
}
