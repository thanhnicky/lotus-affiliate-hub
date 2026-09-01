import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  MousePointerClick,
  UserPlus,
  ShoppingBag,
  PackageCheck,
  Clock,
  Wallet,
  TrendingUp,
  X,
  ArrowLeft,
} from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
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
import type { AdminDashboardBreakdownRow } from "@/types";

type Metric = "clicks" | "leads" | "orders" | "delivered" | "pending" | "available" | "paid";

const METRIC_LABELS: Record<Metric, string> = {
  clicks: "Tổng lượt click",
  leads: "Lead (Zalo/Phone)",
  orders: "Tổng đơn hàng",
  delivered: "Đơn giao thành công",
  pending: "Hoa hồng chờ duyệt",
  available: "Hoa hồng có thể rút",
  paid: "Hoa hồng đã trả",
};

/** Build month options from 2026-08 to current month. */
function buildMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;
  let y = 2026;
  let m = 8;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    const val = `${y}-${String(m).padStart(2, "0")}`;
    options.push({ value: val, label: `Tháng ${m}/${y}` });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return options.reverse();
}

export function AdminDashboardPage() {
  const monthOptions = useMemo(buildMonthOptions, []);
  const [month, setMonth] = useState<string>("all");
  const [drillDown, setDrillDown] = useState<Metric | null>(null);

  const pMonth = month === "all" ? null : month;

  const statsQuery = useQuery({
    queryKey: ["admin-dashboard-stats", month],
    queryFn: () => adminService.getDashboardStats(pMonth),
  });

  const breakdownQuery = useQuery({
    queryKey: ["admin-dashboard-breakdown", month],
    queryFn: () => adminService.getDashboardBreakdown(pMonth),
    enabled: drillDown !== null,
  });

  const stats = statsQuery.data;

  if (drillDown) {
    return (
      <DrillDownView
        metric={drillDown}
        month={month}
        monthOptions={monthOptions}
        onMonthChange={setMonth}
        onBack={() => setDrillDown(null)}
        data={breakdownQuery.data ?? []}
        isLoading={breakdownQuery.isLoading}
        isError={breakdownQuery.isError}
        onRetry={() => void breakdownQuery.refetch()}
      />
    );
  }

  return (
    <AppLayout
      title="Tổng quan hệ thống"
      description="Thống kê toàn bộ hoạt động affiliate của Lotus."
      actions={
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="h-10 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả thời gian</SelectItem>
            {monthOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
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
              Từ click → lead → đơn hàng → giao thành công
              {month !== "all"
                ? ` (${monthOptions.find((o) => o.value === month)?.label})`
                : " (tất cả)"}
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

          {/* Stat cards — clickable for drill-down */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ClickableStatCard
              icon={<MousePointerClick className="h-4 w-4" />}
              label="Tổng lượt click"
              value={formatNumber(stats.total_clicks)}
              hint="Tất cả thời gian"
              onClick={() => setDrillDown("clicks")}
            />
            <ClickableStatCard
              icon={<UserPlus className="h-4 w-4" />}
              label="Lead (Zalo/Phone)"
              value={formatNumber(stats.total_leads)}
              hint={month === "all" ? "Tất cả" : monthOptions.find((o) => o.value === month)?.label}
              onClick={() => setDrillDown("leads")}
            />
            <ClickableStatCard
              icon={<ShoppingBag className="h-4 w-4" />}
              label="Tổng đơn hàng"
              value={formatNumber(stats.total_orders)}
              hint={month === "all" ? "Tất cả" : monthOptions.find((o) => o.value === month)?.label}
              onClick={() => setDrillDown("orders")}
            />
            <ClickableStatCard
              icon={<PackageCheck className="h-4 w-4" />}
              label="Đơn giao thành công"
              value={formatNumber(stats.delivered_orders)}
              hint={month === "all" ? "Tất cả" : monthOptions.find((o) => o.value === month)?.label}
              onClick={() => setDrillDown("delivered")}
            />
          </div>

          {/* Commission cards */}
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <ClickableStatCard
              icon={<Clock className="h-4 w-4" />}
              label="Hoa hồng chờ duyệt"
              value={formatVnd(stats.pending_commission)}
              hint={month === "all" ? "Tất cả" : monthOptions.find((o) => o.value === month)?.label}
              onClick={() => setDrillDown("pending")}
            />
            <ClickableStatCard
              icon={<Wallet className="h-4 w-4" />}
              label="Hoa hồng có thể rút"
              value={formatVnd(stats.available_commission)}
              hint={month === "all" ? "Tất cả" : monthOptions.find((o) => o.value === month)?.label}
              onClick={() => setDrillDown("available")}
            />
            <ClickableStatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Hoa hồng đã trả"
              value={formatVnd(stats.paid_commission)}
              hint={month === "all" ? "Tất cả" : monthOptions.find((o) => o.value === month)?.label}
              highlight
              onClick={() => setDrillDown("paid")}
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

// ─── Drill-down view ───

function DrillDownView({
  metric,
  month,
  monthOptions,
  onMonthChange,
  onBack,
  data,
  isLoading,
  isError,
  onRetry,
}: {
  metric: Metric;
  month: string;
  monthOptions: { value: string; label: string }[];
  onMonthChange: (v: string) => void;
  onBack: () => void;
  data: AdminDashboardBreakdownRow[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const periodLabel =
    month === "all" ? "Tất cả thời gian" : monthOptions.find((o) => o.value === month)?.label;

  // Filter out rows with 0 for the selected metric
  const filtered = data.filter((r) => {
    switch (metric) {
      case "clicks":
        return r.clicks > 0;
      case "leads":
        return r.leads > 0;
      case "orders":
        return r.orders > 0;
      case "delivered":
        return r.delivered_orders > 0;
      case "pending":
        return r.pending_commission > 0;
      case "available":
        return r.available_commission > 0;
      case "paid":
        return r.paid_commission > 0;
    }
  });

  const total = filtered.reduce((sum, r) => {
    switch (metric) {
      case "clicks":
        return sum + r.clicks;
      case "leads":
        return sum + r.leads;
      case "orders":
        return sum + r.orders;
      case "delivered":
        return sum + r.delivered_orders;
      case "pending":
        return sum + r.pending_commission;
      case "available":
        return sum + r.available_commission;
      case "paid":
        return sum + r.paid_commission;
    }
  }, 0);

  const isMoney = metric === "pending" || metric === "available" || metric === "paid";

  return (
    <AppLayout
      title={METRIC_LABELS[metric]}
      description={`Chi tiết theo CTV — ${periodLabel}`}
      actions={
        <Select value={month} onValueChange={onMonthChange}>
          <SelectTrigger className="h-10 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả thời gian</SelectItem>
            {monthOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại tổng quan
      </button>

      <div className="mb-4 rounded-xl bg-brand px-5 py-4 text-primary-foreground">
        <p className="text-xs opacity-80">Tổng {METRIC_LABELS[metric].toLowerCase()}</p>
        <p className="mt-1 font-display text-2xl font-bold">
          {isMoney ? formatVnd(total) : formatNumber(total)}
        </p>
      </div>

      {isError ? (
        <ErrorState onRetry={onRetry} />
      ) : isLoading ? (
        <LoadingState label="Đang tải chi tiết..." />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card p-8 text-center text-sm text-muted-foreground">
          Không có dữ liệu cho mục này.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
          {/* Desktop table */}
          <table className="hidden w-full text-sm sm:table">
            <thead>
              <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Mã CTV</th>
                <th className="px-4 py-2.5 font-medium">Tên CTV</th>
                <th className="px-4 py-2.5 font-medium text-right">{METRIC_LABELS[metric]}</th>
                <th className="px-4 py-2.5 font-medium text-right">Click</th>
                <th className="px-4 py-2.5 font-medium text-right">Lead</th>
                <th className="px-4 py-2.5 font-medium text-right">Đơn</th>
                <th className="px-4 py-2.5 font-medium text-right">Giao</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.affiliate_id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                      {r.affiliate_code}
                    </code>
                  </td>
                  <td className="px-4 py-3 font-medium">{r.affiliate_name}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">
                    {isMoney
                      ? formatVnd(getMetricValue(r, metric))
                      : formatNumber(getMetricValue(r, metric))}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatNumber(r.clicks)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatNumber(r.leads)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatNumber(r.orders)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatNumber(r.delivered_orders)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="divide-y divide-border/40 sm:hidden">
            {filtered.map((r) => (
              <li key={r.affiliate_id} className="p-4">
                <div className="flex items-center justify-between">
                  <code className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                    {r.affiliate_code}
                  </code>
                  <span className="font-semibold text-primary">
                    {isMoney
                      ? formatVnd(getMetricValue(r, metric))
                      : formatNumber(getMetricValue(r, metric))}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium">{r.affiliate_name}</p>
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  <span>{r.clicks} click</span>
                  <span>{r.leads} lead</span>
                  <span>{r.orders} đơn</span>
                  <span>{r.delivered_orders} giao</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppLayout>
  );
}

function getMetricValue(r: AdminDashboardBreakdownRow, metric: Metric): number {
  switch (metric) {
    case "clicks":
      return r.clicks;
    case "leads":
      return r.leads;
    case "orders":
      return r.orders;
    case "delivered":
      return r.delivered_orders;
    case "pending":
      return r.pending_commission;
    case "available":
      return r.available_commission;
    case "paid":
      return r.paid_commission;
  }
}

// ─── Sub-components ───

function ClickableStatCard({
  icon,
  label,
  value,
  hint,
  highlight,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        highlight
          ? "group rounded-2xl bg-brand p-5 text-left text-primary-foreground shadow-card transition hover:shadow-lift"
          : "group rounded-2xl border border-border/70 bg-card p-5 text-left shadow-card transition hover:border-primary/50 hover:shadow-lift"
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
      <p className="mt-2 text-[11px] opacity-50 transition group-hover:opacity-80">
        Xem chi tiết →
      </p>
    </button>
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
