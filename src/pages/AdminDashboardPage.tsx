import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  MousePointerClick,
  UserPlus,
  ShoppingBag,
  PackageCheck,
  Clock,
  Wallet,
  TrendingUp,
} from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState, LoadingState } from "@/components/states";
import { adminService } from "@/services";
import { formatNumber, formatVnd } from "@/lib/format";
import type { ReactNode } from "react";

type Period = "all" | "week" | "month";

const PERIOD_LABELS: Record<Period, string> = {
  all: "Tất cả",
  week: "7 ngày qua",
  month: "30 ngày qua",
};

export function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>("all");

  const statsQuery = useQuery({
    queryKey: ["admin-dashboard-stats", period],
    queryFn: () => adminService.getDashboardStats(period),
  });

  const stats = statsQuery.data;

  return (
    <AppLayout
      title="Tổng quan hệ thống"
      description="Thống kê toàn bộ hoạt động affiliate của Lotus."
      actions={
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="h-10 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="week">7 ngày qua</SelectItem>
            <SelectItem value="month">30 ngày qua</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      {statsQuery.isError ? (
        <ErrorState onRetry={() => void statsQuery.refetch()} />
      ) : statsQuery.isLoading ? (
        <LoadingState label="Đang tải thống kê..." />
      ) : stats ? (
        <>
          {/* Conversion funnel */}
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <h2 className="font-display text-sm font-semibold">Phễu chuyển đổi</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Từ click → lead → đơn hàng → giao thành công ({PERIOD_LABELS[period]})
            </p>
            <div className="mt-4 space-y-2">
              <FunnelBar
                label="Click"
                value={stats.total_clicks}
                max={Math.max(stats.total_clicks, stats.total_leads, stats.total_orders, 1)}
                color="bg-blue-500"
              />
              <FunnelBar
                label="Lead (Zalo/Phone)"
                value={stats.total_leads}
                max={Math.max(stats.total_clicks, 1)}
                color="bg-amber-500"
              />
              <FunnelBar
                label="Đơn hàng"
                value={stats.total_orders}
                max={Math.max(stats.total_clicks, 1)}
                color="bg-primary"
              />
              <FunnelBar
                label="Giao thành công"
                value={stats.delivered_orders}
                max={Math.max(stats.total_clicks, 1)}
                color="bg-green-600"
              />
            </div>
          </div>

          {/* Stat cards */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<MousePointerClick className="h-4 w-4" />}
              label="Tổng lượt click"
              value={formatNumber(stats.total_clicks)}
              hint="Tất cả thời gian"
            />
            <StatCard
              icon={<UserPlus className="h-4 w-4" />}
              label="Lead (Zalo/Phone)"
              value={formatNumber(stats.total_leads)}
              hint={PERIOD_LABELS[period]}
            />
            <StatCard
              icon={<ShoppingBag className="h-4 w-4" />}
              label="Tổng đơn hàng"
              value={formatNumber(stats.total_orders)}
              hint={PERIOD_LABELS[period]}
            />
            <StatCard
              icon={<PackageCheck className="h-4 w-4" />}
              label="Đơn giao thành công"
              value={formatNumber(stats.delivered_orders)}
              hint={PERIOD_LABELS[period]}
            />
          </div>

          {/* Commission cards */}
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label="Hoa hồng chờ duyệt"
              value={formatVnd(stats.pending_commission)}
              hint={PERIOD_LABELS[period]}
            />
            <StatCard
              icon={<Wallet className="h-4 w-4" />}
              label="Hoa hồng có thể rút"
              value={formatVnd(stats.available_commission)}
              hint={PERIOD_LABELS[period]}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Hoa hồng đã trả"
              value={formatVnd(stats.paid_commission)}
              hint={PERIOD_LABELS[period]}
              highlight
            />
          </div>

          {/* Conversion rates */}
          {stats.total_clicks > 0 ? (
            <div className="mt-6 rounded-2xl border border-border/50 bg-card p-5">
              <h2 className="font-display text-sm font-semibold">Tỷ lệ chuyển đổi</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <ConversionRate
                  label="Click → Lead"
                  rate={stats.total_clicks > 0 ? (stats.total_leads / stats.total_clicks) * 100 : 0}
                />
                <ConversionRate
                  label="Lead → Đơn"
                  rate={stats.total_leads > 0 ? (stats.total_orders / stats.total_leads) * 100 : 0}
                />
                <ConversionRate
                  label="Đơn → Giao thành công"
                  rate={
                    stats.total_orders > 0 ? (stats.delivered_orders / stats.total_orders) * 100 : 0
                  }
                />
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </AppLayout>
  );
}

// ─── Sub-components ───

function StatCard({
  icon,
  label,
  value,
  hint,
  highlight,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl bg-brand p-5 text-primary-foreground shadow-card"
          : "rounded-2xl border border-border/70 bg-card p-5 shadow-card"
      }
    >
      <div
        className={
          highlight
            ? "flex items-center gap-2 opacity-90"
            : "flex items-center gap-2 text-muted-foreground"
        }
      >
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-3 font-display text-xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-[11px] opacity-70">{hint}</p> : null}
    </div>
  );
}

function FunnelBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-muted/60">
        <div
          className={`flex h-full items-center rounded-lg ${color} transition-all duration-500`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        >
          <span className="ml-2 text-xs font-medium text-white">{formatNumber(value)}</span>
        </div>
      </div>
    </div>
  );
}

function ConversionRate({ label, rate }: { label: string; rate: number }) {
  return (
    <div className="rounded-xl bg-muted/40 p-4 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-primary">
        {rate > 0 ? rate.toFixed(1) : "0"}%
      </p>
    </div>
  );
}
