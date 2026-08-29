import { Clock, LogOut, MessageCircle } from "lucide-react";

import { LotusMark } from "@/components/LotusMark";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { LoadingState } from "@/components/states";
import { useAuth, useSignOut } from "@/hooks/useAuth";
import { AFFILIATE_STATUS_LABEL, SUPPORT_ZALO, SUPPORT_ZALO_URL } from "@/services";

export function PendingPage() {
  const { affiliate, isLoading } = useAuth();
  const signOut = useSignOut();
  const suspended = affiliate?.status === "suspended";

  return (
    <div className="flex min-h-screen items-center justify-center bg-soft px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card p-8 text-center shadow-card">
        <LotusMark className="mx-auto h-12 w-12" />

        {isLoading ? (
          <div className="mt-6">
            <LoadingState label="Đang kiểm tra trạng thái tài khoản..." />
          </div>
        ) : (
          <>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning-foreground">
              <Clock className="h-3.5 w-3.5" />
              {AFFILIATE_STATUS_LABEL[affiliate?.status ?? "pending"] || affiliate?.status}
            </span>

            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
              {suspended ? "Tài khoản đang tạm khoá" : "Tài khoản đang chờ duyệt"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {suspended
                ? "Vui lòng liên hệ Lotus qua Zalo để được hỗ trợ mở lại tài khoản."
                : "Lotus sẽ xét duyệt hồ sơ của bạn trong 1 ngày làm việc. Sau khi được duyệt, bạn có thể tạo link bán hàng ngay."}
            </p>

            <div className="mt-6 rounded-2xl bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Mã cộng tác viên của bạn</p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="font-display text-xl font-semibold tracking-tight">
                  {affiliate?.affiliate_code ?? "—"}
                </span>
                <CopyButton value={affiliate?.affiliate_code ?? ""} label="Sao chép mã CTV" variant="ghost" />
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <Button asChild className="h-12">
                <a href={SUPPORT_ZALO_URL} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Liên hệ Zalo hỗ trợ {SUPPORT_ZALO}
                </a>
              </Button>
              <Button variant="outline" className="h-12" onClick={() => void signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

