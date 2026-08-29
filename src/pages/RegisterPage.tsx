import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, MailCheck } from "lucide-react";

import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services";

export function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    zalo: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.full_name.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!form.email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (form.password.length < 6) {
      setError("Mật khẩu cần tối thiểu 6 ký tự.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    if (!agree) {
      setError("Vui lòng đồng ý chính sách cộng tác viên.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.signUp({
        full_name: form.full_name,
        phone: form.phone,
        zalo: form.zalo,
        email: form.email,
        password: form.password,
      });

      queryClient.clear();

      if (res.needsEmailConfirmation) {
        setRegisteredEmail(form.email);
        toast.success("Đăng ký thành công!", {
          description: "Vui lòng kiểm tra hộp thư email để xác nhận tài khoản.",
        });
      } else {
        toast.success("Đăng ký thành công", {
          description: "Hồ sơ của bạn đang chờ Lotus duyệt.",
        });
        await navigate({ to: "/pending" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đăng ký chưa thành công.";
      setError(message);
      toast.error("Đăng ký chưa thành công", { description: message });
    } finally {
      setLoading(false);
    }
  }

  if (registeredEmail) {
    return (
      <AuthCard
        title="Xác nhận email"
        subtitle="Lotus Affiliate Portal"
        footer={
          <p className="text-sm text-muted-foreground">
            Đã xác nhận email?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        }
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="h-7 w-7" />
          </div>
          <h2 className="font-display text-lg font-semibold">Kiểm tra hộp thư của bạn</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Chúng tôi đã gửi link kích hoạt đến địa chỉ <span className="font-medium text-foreground">{registeredEmail}</span>.
            Vui lòng nhấn vào link trong email để hoàn tất đăng ký.
          </p>
          <Button asChild className="h-12 w-full mt-4">
            <Link to="/login">Đến trang đăng nhập</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Đăng ký cộng tác viên"
      subtitle="Lotus Affiliate Portal"
      footer={
        <p className="text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Đăng nhập
          </Link>
        </p>
      }
    >
      <div className="mb-5 flex gap-3 rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p>
          Tài khoản cần được Lotus <span className="font-semibold">duyệt</span> trước khi bạn có thể
          tạo link bán hàng. Thời gian duyệt thường trong 1 ngày làm việc.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Họ và tên</Label>
          <Input id="full_name" required className="h-12" value={form.full_name} onChange={set("full_name")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input id="phone" inputMode="tel" required className="h-12" value={form.phone} onChange={set("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zalo">Số Zalo</Label>
            <Input id="zalo" inputMode="tel" className="h-12" value={form.zalo} onChange={set("zalo")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required className="h-12" value={form.email} onChange={set("email")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              required
              className="h-12"
              value={form.password}
              onChange={set("password")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
            <Input
              id="confirm"
              type="password"
              required
              className="h-12"
              value={form.confirm}
              onChange={set("confirm")}
            />
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-border/70 p-3 text-sm">
          <Checkbox
            checked={agree}
            onCheckedChange={(v) => setAgree(v === true)}
            className="mt-0.5"
            aria-label="Đồng ý chính sách cộng tác viên"
          />
          <span className="text-muted-foreground">
            Tôi đồng ý với <span className="font-medium text-foreground">chính sách cộng tác viên</span> của
            sơn Lotus.
          </span>
        </label>

        {error ? (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
        ) : null}

        <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Tạo tài khoản
        </Button>
      </form>
    </AuthCard>
  );
}

