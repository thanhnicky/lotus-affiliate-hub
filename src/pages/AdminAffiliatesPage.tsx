import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Users, Search, Download, TrendingUp, ShoppingBag, Wallet, Clock } from "lucide-react";
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
import type { AdminAffiliate, AffiliateStatus } from "@/types";

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
    const totalPaid = allAffiliates.reduce((s, a) => s + a.paid_commission, 0);
    return { total, active, totalOrders, totalPaid };
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
        <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Xuất Excel
        </Button>
      }
    >
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          icon={<Wallet className="h-4 w-4" />}
          label="Hoa hồng đã trả"
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
          <td colSpan={8} className="px-4 py-4">
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
