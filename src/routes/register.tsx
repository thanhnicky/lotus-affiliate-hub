import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Đăng ký cộng tác viên | Sơn Lotus" },
      {
        name: "description",
        content:
          "Đăng ký làm cộng tác viên bán sơn Lotus: tạo link tiếp thị riêng và nhận hoa hồng theo từng đơn hàng.",
      },
      { property: "og:title", content: "Đăng ký cộng tác viên | Sơn Lotus" },
      {
        property: "og:description",
        content: "Trở thành cộng tác viên bán sơn Lotus chỉ trong vài phút.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Mật khẩu cần ít nhất 6 ký tự");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, phone },
      },
    });
    setLoading(false);

    if (error) {
      toast.error("Đăng ký chưa thành công", { description: error.message });
      return;
    }

    if (!data.session) {
      toast.success("Đã gửi email xác nhận", {
        description: "Vui lòng mở email và bấm vào liên kết xác nhận để hoàn tất đăng ký.",
      });
      return;
    }

    toast.success("Đăng ký thành công!", {
      description: "Hồ sơ của bạn đang chờ quản trị viên duyệt.",
    });
    void navigate({ to: "/pending" });
  }

  return (
    <AuthCard
      title="Đăng ký cộng tác viên"
      subtitle="Chỉ mất 1 phút để bắt đầu bán sơn Lotus"
      footer={
        <p className="text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Đăng nhập
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input
            id="fullName"
            required
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input
            id="phone"
            inputMode="tel"
            required
            placeholder="09xx xxx xxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12"
          />
        </div>
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
            autoComplete="new-password"
            required
            placeholder="Tối thiểu 6 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12"
          />
        </div>
        <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Tạo tài khoản
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Tài khoản mới sẽ ở trạng thái <strong>chờ duyệt</strong> cho đến khi quản trị viên xác
          nhận.
        </p>
      </form>
    </AuthCard>
  );
}
