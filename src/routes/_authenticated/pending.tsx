import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Clock, ShieldAlert, Phone, Mail, LogOut, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LotusMark } from "@/components/LotusMark";
import { useProfile, useSignOut } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/pending")({
  head: () => ({
    meta: [
      { title: "Chờ duyệt tài khoản | Cộng tác viên sơn Lotus" },
      {
        name: "description",
        content: "Tài khoản cộng tác viên của bạn đang chờ quản trị viên sơn Lotus phê duyệt.",
      },
      { property: "og:title", content: "Chờ duyệt tài khoản | Cộng tác viên sơn Lotus" },
      { property: "og:description", content: "Tài khoản đang chờ quản trị viên phê duyệt." },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
  const { data: profile, isLoading, refetch, isFetching } = useProfile();
  const signOut = useSignOut();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && profile?.status === "active") {
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [isLoading, profile, navigate]);

  const suspended = profile?.status === "suspended";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-soft px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-border/70 bg-card p-8 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          {suspended ? (
            <ShieldAlert className="h-8 w-8 text-destructive" />
          ) : (
            <Clock className="h-8 w-8 text-primary" />
          )}
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">
          {suspended ? "Tài khoản đang tạm khoá" : "Tài khoản đang chờ duyệt"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {suspended
            ? "Tài khoản cộng tác viên của bạn hiện đang tạm khoá. Vui lòng liên hệ quản trị viên để được hỗ trợ."
            : "Cảm ơn bạn đã đăng ký làm cộng tác viên sơn Lotus. Quản trị viên sẽ xét duyệt hồ sơ trong vòng 24 giờ làm việc. Sau khi được duyệt, bạn có thể tạo link tiếp thị ngay."}
        </p>

        {profile ? (
          <div className="mt-6 space-y-2 rounded-2xl bg-secondary/60 p-4 text-left text-sm">
            <p>
              <span className="text-muted-foreground">Họ tên: </span>
              <strong>{profile.full_name || "—"}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">Email: </span>
              <strong>{profile.email}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">Mã CTV: </span>
              <strong>{profile.affiliate_code}</strong>
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => void refetch()} disabled={isFetching} className="h-11">
            <RefreshCw className={isFetching ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            Kiểm tra lại trạng thái
          </Button>
          <Button variant="outline" className="h-11" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:justify-center sm:gap-6">
          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4" /> 1900 6789
          </span>
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> ctv@lotuspaint.vn
          </span>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <LotusMark className="h-6 w-6" />
        Sơn Lotus · Chương trình cộng tác viên
      </div>
    </div>
  );
}
