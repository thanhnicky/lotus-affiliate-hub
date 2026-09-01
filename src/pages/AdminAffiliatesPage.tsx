import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Users,
  Search,
  Download,
  TrendingUp,
  ShoppingBag,
  Wallet,
  Clock,
  Trophy,
  Medal,
  Crown,
  UserPlus,
  PackageCheck,
  DollarSign,
} from "lucide-react";
import * as XLSX from "xlsx";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState, LoadingState, EmptyState } from "@/components/states";
import { adminService } from "@/services";
import { formatDate, formatNumber, formatVnd } from "@/lib/format";
import type { AdminAffiliate, AdminDashboardBreakdownRow, AffiliateStatus } from "@/types";

const STATUS_LABEL: Record<AffiliateStatus, string> = {
  pending: "Chờ duyệt",
  active: "Đang hoạt động",
  suspended: "Tạm khoá",
};

const STATUS_BADGE: Record<AffiliateStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground",
  active: "bg-success/15 text-success-foreground",
  suspended: "bg-destructive/10 text-destructive",
};

type SortKey =
  "paid_commission" | "order_count" | "approved_order_count" | "created_at" | "last_order_at";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "paid_commission", label: "Hoa hồng đã trả" },
  { value: "order_count", label: "Tổng đơn hàng" },
  { value: "approved_order_count", label: "Đơn đã duyệt" },
  { value: "last_order_at", label: "Đơn gần nhất" },
  { value: "created_at", label: "Ngày đăng ký" },
];

export function AdminAffiliatesPage() {
  const [tab, setTab] = useState<"list" | "top">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("paid_commission");

  const affiliatesQuery = useQuery({
    queryKey: ["admin-affiliates"],
    queryFn: () => adminService.listAffiliates(),
  });

  const allAffiliates = affiliatesQuery.data ?? [];

  const filtered = useMemo(() => {
    let list = allAffiliates;
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.full_name.toLowerCase().includes(q) ||
          a.affiliate_code.toLowerCase().includes(q) ||
          a.phone.includes(q) ||
          (a.email ?? "").toLowerCase().includes(q),
      );
    }
    // Sort (RPC already sorts by paid_commission, but allow re-sorting in UI)
    const sorted = [...list].sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "string" && typeof bv === "string") {
        return bv.localeCompare(av);
      }
      return (bv as number) - (av as number);
    });
    return sorted;
  }, [allAffiliates, search, statusFilter, sortBy]);

  // Summary stats
  const summary = useMemo(() => {
    const total = allAffiliates.length;
    const active = allAffiliates.filter((a) => a.status === "active").length;
    const totalOrders = allAffiliates.reduce((s, a) => s + a.order_count, 0);
    const totalPending = allAffiliates.reduce((s, a) => s + a.pending_commission, 0);
    const totalAvailable = allAffiliates.reduce((s, a) => s + a.available_commission, 0);
    const totalPaid = allAffiliates.reduce((s, a) => s + a.paid_commission, 0);
    return { total, active, totalOrders, totalPending, totalAvailable, totalPaid };
  }, [allAffiliates]);

  const handleExport = () => {
    const rows = filtered.map((a) => ({
      "Mã CTV": a.affiliate_code,
      "Họ tên": a.full_name,
      SĐT: a.phone,
      Email: a.email ?? "",
      Zalo: a.zalo_id ?? "",
      "Ngân hàng": a.bank_name ?? "",
      "Số TK": a.bank_account ?? "",
      "Chủ TK": a.bank_holder ?? "",
      "Trạng thái": STATUS_LABEL[a.status],
      "Tổng đơn": a.order_count,
      "Đơn đã duyệt": a.approved_order_count,
      "Hoa hồng chờ duyệt": a.pending_commission,
      "Hoa hồng có thể rút": a.available_commission,
      "Hoa hồng đã trả": a.paid_commission,
      "Đơn gần nhất": a.last_order_at ? formatDate(a.last_order_at) : "—",
      "Ngày đăng ký": a.created_at ? formatDate(a.created_at) : "—",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CTV");
    XLSX.writeFile(wb, `danh-sach-ctv-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <AppLayout
      title="Quản lý cộng tác viên"
      description="Danh sách CTV, thống kê hiệu suất và thông tin thanh toán."
      actions={
        tab === "list" ? (
          <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </Button>
        ) : null
      }
    >
      {/* Tab toggle */}
      <div className="mb-6 flex gap-1 rounded-xl bg-muted/60 p-1">
        <button
          onClick={() => setTab("list")}
          className={
            tab === "list"
              ? "flex-1 rounded-lg bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm"
              : "flex-1 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          }
        >
          Danh sách CTV
        </button>
        <button
          onClick={() => setTab("top")}
          className={
            tab === "top"
              ? "flex-1 rounded-lg bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm"
              : "flex-1 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          }
        >
          <Trophy className="mr-1.5 inline h-4 w-4" />
          TOP CTV
        </button>
      </div>

      {tab === "top" ? (
        <TopCtvSection />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <SummaryCard
              icon={<Users className="h-4 w-4" />}
              label="Tổng CTV"
              value={formatNumber(summary.total)}
            />
            <SummaryCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Đang hoạt động"
              value={formatNumber(summary.active)}
            />
            <SummaryCard
              icon={<ShoppingBag className="h-4 w-4" />}
              label="Tổng đơn hàng"
              value={formatNumber(summary.totalOrders)}
            />
            <SummaryCard
              icon={<Clock className="h-4 w-4" />}
              label="Chờ duyệt"
              value={formatVnd(summary.totalPending)}
            />
            <SummaryCard
              icon={<Wallet className="h-4 w-4" />}
              label="Có thể rút"
              value={formatVnd(summary.totalAvailable)}
            />
            <SummaryCard
              icon={<Wallet className="h-4 w-4" />}
              label="Đã trả"
              value={formatVnd(summary.totalPaid)}
              highlight
            />
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, mã CTV, SĐT, email..."
                className="h-10 pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-[160px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="suspended">Tạm khoá</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger className="h-10 w-[180px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="mt-6">
            {affiliatesQuery.isError ? (
              <ErrorState onRetry={() => void affiliatesQuery.refetch()} />
            ) : affiliatesQuery.isLoading ? (
              <LoadingState label="Đang tải danh sách CTV..." />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<Users className="h-5 w-5" />}
                title="Không có CTV nào"
                description="Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm."
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3 font-medium">CTV</th>
                      <th className="px-4 py-3 font-medium">Liên hệ</th>
                      <th className="px-4 py-3 font-medium">Thanh toán</th>
                      <th className="px-4 py-3 text-right font-medium">Đơn</th>
                      <th className="px-4 py-3 text-right font-medium">Đã duyệt</th>
                      <th className="px-4 py-3 text-right font-medium">Chờ duyệt</th>
                      <th className="px-4 py-3 text-right font-medium">Có thể rút</th>
                      <th className="px-4 py-3 text-right font-medium">Đã trả</th>
                      <th className="px-4 py-3 font-medium">Hoạt động</th>
                      <th className="px-4 py-3 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <AffiliateRow key={a.id} affiliate={a} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}

function AffiliateRow({ affiliate: a }: { affiliate: AdminAffiliate }) {
  const [expanded, setExpanded] = useState(false);
  const hasBank = Boolean(a.bank_name || a.bank_account || a.bank_holder);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/30"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3">
          <div className="font-medium">{a.full_name}</div>
          <div className="text-xs text-muted-foreground">{a.affiliate_code}</div>
        </td>
        <td className="px-4 py-3">
          <div className="text-xs">{a.phone}</div>
          {a.email ? <div className="text-xs text-muted-foreground">{a.email}</div> : null}
        </td>
        <td className="px-4 py-3">
          {hasBank ? (
            <div className="text-xs">
              <div>{a.bank_name || "—"}</div>
              <div className="text-muted-foreground">{a.bank_account || "—"}</div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Chưa có</span>
          )}
        </td>
        <td className="px-4 py-3 text-right font-medium">{formatNumber(a.order_count)}</td>
        <td className="px-4 py-3 text-right">{formatNumber(a.approved_order_count)}</td>
        <td className="px-4 py-3 text-right text-muted-foreground">
          {formatVnd(a.pending_commission)}
        </td>
        <td className="px-4 py-3 text-right">{formatVnd(a.available_commission)}</td>
        <td className="px-4 py-3 text-right font-medium">{formatVnd(a.paid_commission)}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground">
          {a.last_order_at ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(a.last_order_at)}
            </span>
          ) : (
            "—"
          )}
        </td>
        <td className="px-4 py-3">
          <Badge className={STATUS_BADGE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-border/40 bg-muted/20">
          <td colSpan={10} className="px-4 py-4">
            <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="Mã CTV" value={a.affiliate_code} />
              <DetailItem label="Zalo" value={a.zalo_id || "—"} />
              <DetailItem label="Email" value={a.email || "—"} />
              <DetailItem label="SĐT" value={a.phone} />
              <DetailItem label="Ngân hàng" value={a.bank_name || "—"} />
              <DetailItem label="Số tài khoản" value={a.bank_account || "—"} />
              <DetailItem label="Chủ tài khoản" value={a.bank_holder || "—"} />
              <DetailItem label="Hoa hồng chờ" value={formatVnd(a.pending_earnings ?? 0)} />
              <DetailItem label="Tổng hoa hồng" value={formatVnd(a.total_earnings ?? 0)} />
              <DetailItem label="Đã thanh toán" value={formatVnd(a.paid_earnings ?? 0)} />
              <DetailItem
                label="Ngày đăng ký"
                value={a.created_at ? formatDate(a.created_at) : "—"}
              />
              <DetailItem
                label="Ngày duyệt"
                value={a.approved_at ? formatDate(a.approved_at) : "—"}
              />
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
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
      <div className="flex items-center gap-2 opacity-80">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

// ─── TOP CTV Section ───

type TopMetric = "delivered_revenue" | "orders" | "delivered_orders" | "leads";

const TOP_METRIC_OPTIONS: { value: TopMetric; label: string }[] = [
  { value: "delivered_revenue", label: "Doanh thu đã giao" },
  { value: "orders", label: "Tổng đơn hàng" },
  { value: "delivered_orders", label: "Đơn giao thành công" },
  { value: "leads", label: "Số Lead" },
];

function buildMonthOptionsForTop(): { value: string; label: string }[] {
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

function TopCtvSection() {
  const monthOptions = useMemo(buildMonthOptionsForTop, []);
  const [month, setMonth] = useState<string>("all");
  const [metric, setMetric] = useState<TopMetric>("delivered_revenue");

  const pMonth = month === "all" ? null : month;

  const breakdownQuery = useQuery({
    queryKey: ["admin-top-ctv", month],
    queryFn: () => adminService.getDashboardBreakdown(pMonth),
  });

  const allRows = breakdownQuery.data ?? [];

  // Filter rows with > 0 for the selected metric, then sort
  const ranked = useMemo(() => {
    const filtered = allRows.filter((r) => getTopMetricValue(r, metric) > 0);
    return filtered
      .sort((a, b) => getTopMetricValue(b, metric) - getTopMetricValue(a, metric))
      .slice(0, 10);
  }, [allRows, metric]);

  const periodLabel =
    month === "all" ? "Tất cả thời gian" : monthOptions.find((o) => o.value === month)?.label;
  const isMoney = metric === "delivered_revenue";

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="h-10 w-[160px]">
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
        <Select value={metric} onValueChange={(v) => setMetric(v as TopMetric)}>
          <SelectTrigger className="h-10 w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TOP_METRIC_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{periodLabel}</span>
      </div>

      {/* Podium — top 3 */}
      {ranked.length >= 3 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <PodiumCard rank={2} row={ranked[1]!} metric={metric} isMoney={isMoney} />
          <PodiumCard rank={1} row={ranked[0]!} metric={metric} isMoney={isMoney} />
          <PodiumCard rank={3} row={ranked[2]!} metric={metric} isMoney={isMoney} />
        </div>
      ) : null}

      {/* Full ranking table */}
      <div className="mt-6">
        {breakdownQuery.isError ? (
          <ErrorState onRetry={() => void breakdownQuery.refetch()} />
        ) : breakdownQuery.isLoading ? (
          <LoadingState label="Đang tải xếp hạng..." />
        ) : ranked.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-5 w-5" />}
            title="Chưa có dữ liệu"
            description={`Chưa có CTV nào có ${TOP_METRIC_OPTIONS.find((o) => o.value === metric)?.label.toLowerCase()} trong ${(periodLabel ?? "").toLowerCase()}.`}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Mã CTV</th>
                  <th className="px-4 py-3 font-medium">Tên CTV</th>
                  <th className="px-4 py-3 text-right font-medium">
                    {TOP_METRIC_OPTIONS.find((o) => o.value === metric)?.label}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Doanh thu đã giao</th>
                  <th className="px-4 py-3 text-right font-medium">Đơn</th>
                  <th className="px-4 py-3 text-right font-medium">Giao</th>
                  <th className="px-4 py-3 text-right font-medium">Lead</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r, i) => (
                  <tr
                    key={r.affiliate_id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <RankBadge rank={i + 1} />
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                        {r.affiliate_code}
                      </code>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.affiliate_name}</td>
                    <td className="px-4 py-3 text-right font-bold text-primary">
                      {isMoney
                        ? formatVnd(getTopMetricValue(r, metric))
                        : formatNumber(getTopMetricValue(r, metric))}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatVnd(r.delivered_revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatNumber(r.orders)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatNumber(r.delivered_orders)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatNumber(r.leads)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Xếp hạng theo {TOP_METRIC_OPTIONS.find((o) => o.value === metric)?.label.toLowerCase()} —
        top 10 CTV xuất sắc. Dùng để khen thưởng theo quý/năm.
      </p>
    </div>
  );
}

function getTopMetricValue(r: AdminDashboardBreakdownRow, metric: TopMetric): number {
  switch (metric) {
    case "delivered_revenue":
      return r.delivered_revenue;
    case "orders":
      return r.orders;
    case "delivered_orders":
      return r.delivered_orders;
    case "leads":
      return r.leads;
  }
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Crown className="h-4 w-4" />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-600">
        <Medal className="h-4 w-4" />
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-700">
        <Medal className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
      {rank}
    </span>
  );
}

function PodiumCard({
  rank,
  row,
  metric,
  isMoney,
}: {
  rank: number;
  row: AdminDashboardBreakdownRow;
  metric: TopMetric;
  isMoney: boolean;
}) {
  const styles =
    rank === 1
      ? "border-amber-300 bg-amber-50 order-2 sm:order-1"
      : rank === 2
        ? "border-slate-300 bg-slate-50 order-1 sm:order-2"
        : "border-orange-300 bg-orange-50 order-3";
  const iconColor =
    rank === 1 ? "text-amber-600" : rank === 2 ? "text-slate-500" : "text-orange-600";

  return (
    <div className={`rounded-2xl border-2 p-5 text-center ${styles}`}>
      <div className="flex justify-center">
        {rank === 1 ? (
          <Crown className={`h-8 w-8 ${iconColor}`} />
        ) : (
          <Medal className={`h-7 w-7 ${iconColor}`} />
        )}
      </div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">Hạng {rank}</p>
      <p className="mt-1 font-display text-sm font-semibold">{row.affiliate_name}</p>
      <code className="mt-0.5 inline-block rounded bg-white/60 px-2 py-0.5 text-xs text-muted-foreground">
        {row.affiliate_code}
      </code>
      <p className="mt-3 font-display text-xl font-bold text-primary">
        {isMoney
          ? formatVnd(getTopMetricValue(row, metric))
          : formatNumber(getTopMetricValue(row, metric))}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {TOP_METRIC_OPTIONS.find((o) => o.value === metric)?.label}
      </p>
      <div className="mt-3 flex justify-center gap-3 text-[11px] text-muted-foreground">
        <span>{formatNumber(row.orders)} đơn</span>
        <span>{formatNumber(row.delivered_orders)} giao</span>
        <span>{formatNumber(row.leads)} lead</span>
      </div>
    </div>
  );
}
