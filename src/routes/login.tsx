import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Đăng nhập | Cổng cộng tác viên sơn Lotus" },
      {
        name: "description",
        content:
          "Đăng nhập cổng cộng tác viên sơn Lotus để tạo link tiếp thị và theo dõi hiệu quả bán hàng.",
      },
      { property: "og:title", content: "Đăng nhập | Cổng cộng tác viên sơn Lotus" },
      {
        property: "og:description",
        content: "Đăng nhập để tạo link tiếp thị sản phẩm sơn Lotus.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Đăng nhập chưa thành công", {
        description: "Email hoặc mật khẩu chưa đúng. Vui lòng thử lại.",
      });
      return;
    }
    toast.success("Chào mừng bạn trở lại!");
    void navigate({ to: "/dashboard" });
  }

  return (
    <AuthCard
      title="Đăng nhập"
      subtitle="Cổng cộng tác viên sơn Lotus"
      footer={
        <p className="text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Đăng ký ngay
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
            placeholder="ban@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12"
          />
        </div>
        <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Đăng nhập
        </Button>
      </form>
    </AuthCard>
  );
}
