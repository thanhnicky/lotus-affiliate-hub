import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { CardsSkeleton, EmptyState, ErrorState } from "@/components/states";
import { useAuth } from "@/hooks/useAuth";
import { linksService, withdrawalsService } from "@/services";
import { formatDate, formatVnd } from "@/lib/format";

export function WithdrawalsPage() {
  const { affiliate } = useAuth();
  const affiliateId = affiliate?.id;

  const statsQuery = useQuery({
    queryKey: ["stats", affiliateId],
    queryFn: () => linksService.getDashboardStats(affiliateId!),
    enabled: Boolean(affiliateId),
  });

  const listQuery = useQuery({
    queryKey: ["withdrawals", affiliateId],
    queryFn: () => withdrawalsService.listWithdrawals(affiliateId!),
    enabled: Boolean(affiliateId),
  });

  // Only show payouts the company has actually transferred (status = paid).
  // Pending/rejected requests are an internal workflow, not something the CTV
  // needs to see in this simplified view.
  const payouts = (listQuery.data ?? []).filter((w) => w.status === "paid");

  return (
    <AppLayout
      title="Hoa hồng & Thanh toán"
      description="Theo dõi số dư hoa hồng và lịch sử công ty đã thanh toán."
    >
      <div className="space-y-6">
        {/* Balance card */}
        <div className="rounded-3xl bg-brand p-6 text-primary-foreground shadow-lift">
          <div className="flex items-center gap-2 opacity-90">
            <Wallet className="h-4 w-4" />
            <span className="text-xs">Số dư có thể rút</span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold tracking-tight">
            {statsQuery.isLoading ? "…" : formatVnd(statsQuery.data?.available_commission ?? 0)}
          </p>
          <p className="mt-2 text-xs opacity-80">
            Hoa hồng chờ đối soát: {formatVnd(statsQuery.data?.pending_commission ?? 0)}
          </p>
        </div>

        {/* Payment schedule note */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">
            Cám ơn quý cộng tác viên đã đồng hành cùng sơn Lotus. Công ty thanh toán tiền hoa hồng
            từ ngày 1 đến ngày 5 hàng tháng.
          </p>
        </div>

        {/* Payout history */}
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">Lịch sử thanh toán</h2>
          {listQuery.isError ? (
            <ErrorState onRetry={() => void listQuery.refetch()} />
          ) : listQuery.isLoading ? (
            <CardsSkeleton count={3} />
          ) : payouts.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-5 w-5" />}
              title="Chưa có lịch sử thanh toán"
              description="Khi công ty chuyển khoản hoa hồng, chi tiết sẽ xuất hiện ở đây."
            />
          ) : (
            <ul className="grid gap-3">
              {payouts.map((w) => (
                <li
                  key={w.id}
                  className="rounded-2xl border border-border/70 bg-card p-4 shadow-card"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg font-semibold">
                      {formatVnd(w.amount)}
                    </span>
                    <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success-foreground">
                      Đã thanh toán
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(w.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {w.bank_name} · {w.bank_account} · {w.bank_holder}
                  </p>
                  {w.note ? (
                    <p className="mt-1 text-sm text-muted-foreground">Ghi chú: {w.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
