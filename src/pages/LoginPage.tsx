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
      await authService.signIn(email, password);
      queryClient.clear();
      toast.success("Chào mừng bạn trở lại!");
      await navigate({ to: "/dashboard" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đăng nhập chưa thành công.";
      setError(message);
      toast.error("Đăng nhập chưa thành công", { description: message });
    } finally {
      setLoading(false);
    }
  }

  async function onForgotPassword() {
    try {
      await authService.requestPasswordReset(email);
      toast.success("Đã gửi hướng dẫn đặt lại mật khẩu", {
        description: "Vui lòng kiểm tra email của bạn.",
      });
    } catch {
      toast.error("Vui lòng nhập email trước khi đặt lại mật khẩu.");
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

      <p className="mt-6 rounded-xl bg-secondary px-4 py-3 text-xs text-secondary-foreground">
        Chế độ demo giao diện: đăng nhập thử với{" "}
        <span className="font-semibold">demo@lotus.vn</span> /{" "}
        <span className="font-semibold">lotus123</span>.
      </p>
    </AuthCard>
  );
}
