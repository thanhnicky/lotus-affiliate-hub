import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services";
import { supabase } from "@/integrations/supabase/client";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const authResult = await authService.signIn(email, password);
      queryClient.clear();

      // Kiểm tra trạng thái CTV để điều hướng chính xác
      const { data: profile } = await supabase
        .from("affiliates")
        .select("status")
        .eq("user_id", authResult.user_id)
        .maybeSingle();

      if (profile?.status === "active") {
        toast.success("Chào mừng bạn trở lại!");
        await navigate({ to: "/dashboard" });
      } else if (profile?.status === "suspended") {
        toast.warning("Tài khoản của bạn đang bị tạm khóa.");
        await navigate({ to: "/suspended" });
      } else {
        toast.info("Tài khoản của bạn đang chờ Lotus xét duyệt.");
        await navigate({ to: "/pending" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đăng nhập chưa thành công.";
      setError(message);
      toast.error("Đăng nhập chưa thành công", { description: message });
    } finally {
      setLoading(false);
    }
  }

  async function onForgotPassword() {
    if (!email.trim()) {
      toast.error("Vui lòng nhập email trước khi yêu cầu đặt lại mật khẩu.");
      return;
    }
    try {
      await authService.requestPasswordReset(email);
      toast.success("Đã gửi email đặt lại mật khẩu", {
        description: "Vui lòng kiểm tra hộp thư của bạn.",
      });
    } catch (err: any) {
      toast.error("Không gửi được email đặt lại mật khẩu", {
        description: err?.message || "Vui lòng thử lại sau.",
      });
    }
  }

  return (
    <AuthCard
      title="Đăng nhập"
      subtitle="Lotus Affiliate Portal"
      footer={
        <p className="text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Đăng ký cộng tác viên
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            className="h-12"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
        ) : null}

        <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Đăng nhập
        </Button>

        <button
          type="button"
          onClick={() => void onForgotPassword()}
          className="w-full text-center text-sm text-muted-foreground hover:text-primary"
        >
          Quên mật khẩu?
        </button>
      </form>
    </AuthCard>
  );
}

