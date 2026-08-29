import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Lock, LogOut } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState } from "@/components/states";
import { useAuth, useSignOut } from "@/hooks/useAuth";
import { AFFILIATE_STATUS_LABEL, profileService } from "@/services";
import { formatVnd } from "@/lib/format";

export function ProfilePage() {
  const { affiliate, user, isLoading, error, refreshProfile } = useAuth();
  const signOut = useSignOut();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    zalo_id: "",
    bank_name: "",
    bank_account: "",
    bank_holder: "",
  });

  useEffect(() => {
    if (!affiliate) return;
    setForm({
      full_name: affiliate.full_name || "",
      phone: affiliate.phone || "",
      zalo_id: affiliate.zalo_id || "",
      bank_name: affiliate.bank_name || "",
      bank_account: affiliate.bank_account || "",
      bank_holder: affiliate.bank_holder || "",
    });
  }, [affiliate]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = useMutation({
    mutationFn: () =>
      profileService.updateProfile(affiliate!.id, {
        full_name: form.full_name,
        phone: form.phone,
        zalo_id: form.zalo_id,
        bank_name: form.bank_name,
        bank_account: form.bank_account,
        bank_holder: form.bank_holder,
      }),
    onSuccess: async () => {
      await refreshProfile();
      toast.success("Đã lưu thông tin hồ sơ");
    },
    onError: (e: Error) => toast.error("Lưu không thành công", { description: e.message }),
  });

  return (
    <AppLayout title="Hồ sơ của tôi" description="Cập nhật thông tin liên hệ và tài khoản nhận hoa hồng.">
      {error ? (
        <ErrorState onRetry={() => void refreshProfile()} />
      ) : isLoading || !affiliate ? (
        <LoadingState label="Đang tải hồ sơ..." />
      ) : (
        <div className="grid max-w-3xl gap-6">
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <h2 className="text-sm font-medium">Thông tin do Lotus quản lý</h2>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <ReadOnly label="Mã cộng tác viên" value={affiliate.affiliate_code || "—"} />
              <ReadOnly label="Email đăng nhập" value={affiliate.email || user?.email || "—"} />
              <ReadOnly
                label="Tỷ lệ hoa hồng"
                value={`${Math.round((affiliate.commission_rate ?? 0) * 100)}%`}
              />
              <ReadOnly
                label="Trạng thái"
                value={AFFILIATE_STATUS_LABEL[affiliate.status] || affiliate.status}
              />
              <ReadOnly
                label="Vai trò"
                value={affiliate.role === "admin" ? "Quản trị" : "Cộng tác viên"}
              />
              <ReadOnly
                label="Tổng hoa hồng tích luỹ"
                value={formatVnd(affiliate.total_earnings ?? 0)}
                hint="Xem chi tiết ở trang Rút tiền"
              />
            </dl>
          </section>

          <form
            className="space-y-4 rounded-3xl border border-border/70 bg-card p-6 shadow-card"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <h2 className="font-display text-lg font-semibold">Thông tin của bạn</h2>
            <div className="space-y-2">
              <Label htmlFor="full_name">Họ và tên</Label>
              <Input
                id="full_name"
                required
                className="h-12"
                value={form.full_name}
                onChange={set("full_name")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  required
                  className="h-12"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zalo_id">Số Zalo</Label>
                <Input
                  id="zalo_id"
                  inputMode="tel"
                  className="h-12"
                  value={form.zalo_id}
                  onChange={set("zalo_id")}
                />
              </div>
            </div>

            <h3 className="pt-2 text-sm font-medium text-muted-foreground">Tài khoản nhận hoa hồng</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Ngân hàng</Label>
                <Input
                  id="bank_name"
                  className="h-12"
                  value={form.bank_name}
                  onChange={set("bank_name")}
                  placeholder="vd: Vietcombank, MB Bank..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account">Số tài khoản</Label>
                <Input
                  id="bank_account"
                  inputMode="numeric"
                  className="h-12"
                  value={form.bank_account}
                  onChange={set("bank_account")}
                  placeholder="Số tài khoản nhận tiền"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_holder">Chủ tài khoản</Label>
              <Input
                id="bank_holder"
                className="h-12"
                value={form.bank_holder}
                onChange={set("bank_holder")}
                placeholder="Tên in trên thẻ/tài khoản (viết hoa)"
              />
            </div>

            <Button type="submit" className="h-12 w-full sm:w-auto sm:px-8" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Lưu thay đổi
            </Button>
          </form>

          <Button variant="outline" className="h-12 w-full sm:w-auto" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      )}
    </AppLayout>
  );
}

function ReadOnly({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold">{value}</dd>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

