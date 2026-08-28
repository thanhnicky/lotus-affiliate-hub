import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSignOut } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Hồ sơ cộng tác viên | Sơn Lotus" },
      {
        name: "description",
        content: "Cập nhật họ tên, số điện thoại và xem mã cộng tác viên sơn Lotus của bạn.",
      },
      { property: "og:title", content: "Hồ sơ cộng tác viên | Sơn Lotus" },
      { property: "og:description", content: "Quản lý thông tin cộng tác viên sơn Lotus." },
    ],
  }),
  component: ProfilePage,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ duyệt",
  active: "Đang hoạt động",
  suspended: "Tạm khoá",
};

function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();
  const signOut = useSignOut();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone);
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Chưa tải được hồ sơ");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Đã lưu thông tin");
    },
    onError: (e: Error) => toast.error("Lưu không thành công", { description: e.message }),
  });

  return (
    <AppShell title="Hồ sơ của tôi" description="Cập nhật thông tin liên hệ của bạn.">
      <div className="max-w-xl space-y-6">
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải hồ sơ...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  Mã CTV: {profile?.affiliate_code}
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                  {STATUS_LABEL[profile?.status ?? "pending"]}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email ?? ""} disabled className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12"
                />
              </div>

              <Button
                className="h-12 w-full sm:w-auto sm:px-8"
                disabled={save.isPending}
                onClick={() => save.mutate()}
              >
                {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Lưu thay đổi
              </Button>
            </div>
          )}
        </div>

        <Button variant="outline" className="h-12 w-full sm:w-auto" onClick={() => void signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </AppShell>
  );
}
