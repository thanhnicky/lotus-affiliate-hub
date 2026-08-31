import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Download, Loader2, RotateCcw, ShoppingBag, XCircle } from "lucide-react";
import * as XLSX from "xlsx";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState, LoadingState, EmptyState } from "@/components/states";
import { COMMISSION_STATUS_LABEL, ordersService } from "@/services";
import { formatDate, formatVnd } from "@/lib/format";
import type { CommissionStatus, Order } from "@/types";

const STATUS_BADGE: Record<CommissionStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground",
  approved: "bg-success/15 text-success-foreground",
  paid: "bg-success/15 text-success-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  fraud: "bg-destructive/10 text-destructive",
};

function generateOrderCode() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AdminOrdersPage() {
  const queryClient = useQueryClient();

  const [affiliateCode, setAffiliateCode] = useState("");
  const [finalAmount, setFinalAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [campaignSlug, setCampaignSlug] = useState("");

  // Export date range — defaults to empty (export all). Stored as yyyy-mm-dd
  // strings for native <input type="date"> control.
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => ordersService.listOrders(),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const createOrder = useMutation({
    mutationFn: () =>
      ordersService.createOrder({
        order_code: generateOrderCode(),
        affiliate_code: affiliateCode,
        final_amount: Number(finalAmount.replace(/\D/g, "")),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        campaign_slug: campaignSlug.trim() || undefined,
      }),
    onSuccess: (order) => {
      setAffiliateCode("");
      setFinalAmount("");
      setCustomerName("");
      setCustomerPhone("");
      setCampaignSlug("");
      invalidate();
      toast.success(
        order.affiliate_id
          ? `Đã tạo đơn hàng, hoa hồng ${formatVnd(order.commission_amount ?? 0)} đang chờ duyệt`
          : "Đã tạo đơn hàng (không khớp cộng tác viên nào, không tính hoa hồng)",
      );
    },
    onError: (e: Error) => toast.error("Không tạo được đơn hàng", { description: e.message }),
  });

  const [processingId, setProcessingId] = useState<string | null>(null);
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "cancelled" | "paid" }) =>
      ordersService.updateCommissionStatus(id, status),
    onMutate: ({ id }) => setProcessingId(id),
    onSuccess: (order) => {
      invalidate();
      const msg =
        order.commission_status === "approved"
          ? "Đã duyệt hoa hồng"
          : order.commission_status === "paid"
            ? "Đã đánh dấu đã thanh toán"
            : "Đã huỷ hoa hồng";
      toast.success(msg);
    },
    onError: (e: Error) => toast.error("Không cập nhật được đơn hàng", { description: e.message }),
    onSettled: () => setProcessingId(null),
  });

  const canSubmit =
    Boolean(affiliateCode.trim()) &&
    Number(finalAmount.replace(/\D/g, "")) > 0 &&
    Boolean(customerName.trim()) &&
    Boolean(customerPhone.trim()) &&
    !createOrder.isPending;

  const orders: Order[] = ordersQuery.data ?? [];

  // Orders filtered by the export date range (based on created_at). Empty
  // range = all orders. Used both for the export and to show the count.
  const exportFilteredOrders = useMemo(() => {
    if (!exportFrom && !exportTo) return orders;
    const fromTs = exportFrom ? new Date(exportFrom + "T00:00:00").getTime() : -Infinity;
    // Inclusive of the end day: add 24h - 1ms.
    const toTs = exportTo ? new Date(exportTo + "T23:59:59.999").getTime() : Infinity;
    return orders.filter((o) => {
      const ts = new Date(o.created_at).getTime();
      return ts >= fromTs && ts <= toTs;
    });
  }, [orders, exportFrom, exportTo]);

  const handleExportExcel = () => {
    if (exportFilteredOrders.length === 0) {
      toast.error("Không có đơn hàng nào trong khoảng thời gian đã chọn.");
      return;
    }
    setIsExporting(true);
    try {
      const rows = exportFilteredOrders.map((o) => ({
        "Mã đơn": o.order_code,
        "Ngày tạo": formatDate(o.created_at),
        "Tên khách": o.customer_name,
        SĐT: o.customer_phone,
        Email: o.customer_email ?? "",
        "Tổng tiền (đ)": o.total_amount,
        "Giảm giá (đ)": o.discount_amount,
        "Thực thu (đ)": o.final_amount,
        "Mã CTV (UUID)": o.affiliate_id ?? "",
        "Mã link (UUID)": o.affiliate_link_id ?? "",
        "Hoa hồng (đ)": o.commission_amount ?? 0,
        "Tỷ lệ hoa hồng": o.commission_rate ?? "",
        "Trạng thái hoa hồng": o.commission_status
          ? COMMISSION_STATUS_LABEL[o.commission_status]
          : "",
        "Trạng thái đơn": o.order_status,
        "Trạng thái thanh toán": o.payment_status,
        "Phương thức TT": o.payment_method ?? "",
        "Địa chỉ giao": o.shipping_address ?? "",
        "Ghi chú": o.notes ?? "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      // Auto-size columns based on header + content length.
      const colWidths = Object.keys(rows[0] ?? {}).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...rows.map((r) => String((r as Record<string, unknown>)[key] ?? "").length),
        );
        return { wch: Math.min(maxLen + 2, 40) };
      });
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Đơn hàng");

      const rangeLabel =
        exportFrom || exportTo ? `_${exportFrom || "dau"}_${exportTo || "nay"}` : "_toan_bo";
      const fileName = `don_hang${rangeLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`Đã xuất ${exportFilteredOrders.length} đơn hàng ra file Excel.`);
    } catch (err) {
      toast.error("Không xuất được file Excel.", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsExporting(false);
    }
  };
  // Status filter: "all" (default) shows the pending/resolved split view;
  // any specific status shows a flat list of orders in that status.
  const [statusFilter, setStatusFilter] = useState<"all" | CommissionStatus | "none">("all");

  const pending = orders.filter((o) => o.commission_status === "pending");
  const resolved = orders.filter((o) => o.commission_status !== "pending");

  // When a specific status filter is active, show a flat list instead of the
  // pending/resolved split. "none" covers orders with no affiliate
  // (commission_status is NULL).
  const filteredForDisplay = useMemo(() => {
    if (statusFilter === "all") return null;
    if (statusFilter === "none") return orders.filter((o) => !o.commission_status);
    return orders.filter((o) => o.commission_status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <AppLayout
      title="Quản lý đơn hàng"
      description="Nhập đơn hàng thủ công và duyệt hoa hồng cho cộng tác viên."
    >
      {/* Export + filter bar */}
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-card">
        <div className="space-y-1">
          <Label htmlFor="status-filter" className="text-xs">
            Lọc theo trạng thái
          </Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger id="status-filter" className="h-10 w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt chưa TT</SelectItem>
              <SelectItem value="paid">Đã thanh toán</SelectItem>
              <SelectItem value="cancelled">Đã huỷ</SelectItem>
              <SelectItem value="none">Không có CTV</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mx-2 hidden h-10 w-px bg-border/60 sm:block" />
        <div className="space-y-1">
          <Label htmlFor="export-from" className="text-xs">
            Từ ngày
          </Label>
          <Input
            id="export-from"
            type="date"
            className="h-10 w-[160px]"
            value={exportFrom}
            onChange={(e) => setExportFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="export-to" className="text-xs">
            Đến ngày
          </Label>
          <Input
            id="export-to"
            type="date"
            className="h-10 w-[160px]"
            value={exportTo}
            onChange={(e) => setExportTo(e.target.value)}
          />
        </div>
        <Button
          onClick={handleExportExcel}
          disabled={isExporting || exportFilteredOrders.length === 0}
          className="h-10"
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Xuất Excel ({exportFilteredOrders.length})
        </Button>
        {(exportFrom || exportTo) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10"
            onClick={() => {
              setExportFrom("");
              setExportTo("");
            }}
          >
            Xóa lọc
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <form
          className="h-fit space-y-4 rounded-3xl border border-border/70 bg-card p-6 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) createOrder.mutate();
          }}
        >
          <h2 className="font-display text-lg font-semibold">Tạo đơn hàng</h2>
          <div className="space-y-2">
            <Label htmlFor="affiliate-code">Mã cộng tác viên</Label>
            <Input
              id="affiliate-code"
              className="h-12"
              placeholder="LOTUS-XXXXXX"
              value={affiliateCode}
              onChange={(e) => setAffiliateCode(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="final-amount">Giá trị đơn hàng thực thu (đ)</Label>
            <Input
              id="final-amount"
              inputMode="numeric"
              className="h-12"
              placeholder="1680000"
              value={finalAmount}
              onChange={(e) => setFinalAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Hoa hồng được tính trên số tiền này (sau khi trừ giảm giá).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-slug">Campaign (tuỳ chọn)</Label>
            <Input
              id="campaign-slug"
              className="h-12"
              placeholder="vd: thanh-test-t9"
              value={campaignSlug}
              onChange={(e) => setCampaignSlug(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Dùng để ghi nhận lượt chuyển đổi vào đúng link. Bỏ trống nếu không rõ.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-name">Tên khách hàng</Label>
            <Input
              id="customer-name"
              className="h-12"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone">SĐT khách hàng</Label>
            <Input
              id="customer-phone"
              className="h-12"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
          <Button type="submit" className="h-12 w-full" disabled={!canSubmit}>
            {createOrder.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Tạo đơn hàng
          </Button>
        </form>

        <div className="space-y-8">
          {ordersQuery.isError ? (
            <ErrorState onRetry={() => void ordersQuery.refetch()} />
          ) : ordersQuery.isLoading ? (
            <LoadingState label="Đang tải danh sách đơn hàng..." />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="h-5 w-5" />}
              title="Chưa có đơn hàng nào"
              description="Tạo đơn hàng thủ công ở form bên trái để bắt đầu."
            />
          ) : filteredForDisplay ? (
            // Flat list when a specific status filter is active.
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold">
                {statusFilter === "all"
                  ? ""
                  : statusFilter === "none"
                    ? "Không có CTV"
                    : COMMISSION_STATUS_LABEL[statusFilter as CommissionStatus]}{" "}
                ({filteredForDisplay.length})
              </h2>
              {filteredForDisplay.length === 0 ? (
                <p className="text-sm text-muted-foreground">Không có đơn hàng nào.</p>
              ) : (
                <ul className="grid gap-3">
                  {filteredForDisplay.map((order) => (
                    <li
                      key={order.id}
                      className="rounded-2xl border border-border/70 bg-card p-4 shadow-card"
                    >
                      <OrderSummary order={order} />
                      <OrderActions
                        order={order}
                        processingId={processingId}
                        onStatus={updateStatus.mutate}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <>
              <section>
                <h2 className="mb-3 font-display text-lg font-semibold">
                  Chờ duyệt ({pending.length})
                </h2>
                {pending.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có đơn nào đang chờ duyệt.</p>
                ) : (
                  <ul className="grid gap-3">
                    {pending.map((order) => (
                      <li
                        key={order.id}
                        className="rounded-2xl border border-border/70 bg-card p-4 shadow-card"
                      >
                        <OrderSummary order={order} />
                        <OrderActions
                          order={order}
                          processingId={processingId}
                          onStatus={updateStatus.mutate}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h2 className="mb-3 font-display text-lg font-semibold">Đã xử lý</h2>
                {resolved.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có đơn nào được duyệt/huỷ.</p>
                ) : (
                  <ul className="grid gap-3">
                    {resolved.map((order) => (
                      <li
                        key={order.id}
                        className="rounded-2xl border border-border/70 bg-card p-4 shadow-card"
                      >
                        <OrderSummary order={order} />
                        <OrderActions
                          order={order}
                          processingId={processingId}
                          onStatus={updateStatus.mutate}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function OrderSummary({ order }: { order: Order }) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-lg font-semibold">
            {formatVnd(order.final_amount)}
          </span>
          {order.commission_status ? (
            <Badge className={STATUS_BADGE[order.commission_status]}>
              {COMMISSION_STATUS_LABEL[order.commission_status]}
            </Badge>
          ) : null}
          {!order.affiliate_id ? (
            <Badge variant="outline" className="text-muted-foreground">
              Không khớp CTV
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Mã đơn: {order.order_code}
          {order.affiliate_id ? ` · Hoa hồng: ${formatVnd(order.commission_amount ?? 0)}` : ""}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {order.customer_name} · {order.customer_phone}
        </p>
      </div>
      <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
    </div>
  );
}

/** Action buttons for an order, depending on its current commission_status. */
function OrderActions({
  order,
  processingId,
  onStatus,
}: {
  order: Order;
  processingId: string | null;
  onStatus: (args: { id: string; status: "approved" | "cancelled" | "paid" }) => void;
}) {
  // No affiliate -> no commission to act on.
  if (!order.affiliate_id) return null;

  const busy = processingId === order.id;

  if (order.commission_status === "pending") {
    return (
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          disabled={busy}
          onClick={() => onStatus({ id: order.id, status: "approved" })}
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          Duyệt
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => onStatus({ id: order.id, status: "cancelled" })}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Huỷ
        </Button>
      </div>
    );
  }

  if (order.commission_status === "approved") {
    return (
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          disabled={busy}
          onClick={() => onStatus({ id: order.id, status: "paid" })}
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          Đã thanh toán
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => onStatus({ id: order.id, status: "cancelled" })}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Huỷ
        </Button>
      </div>
    );
  }

  if (order.commission_status === "paid") {
    return (
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => onStatus({ id: order.id, status: "approved" })}
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-2 h-4 w-4" />
          )}
          Hoàn tác
        </Button>
      </div>
    );
  }

  // cancelled / fraud / null: no actions.
  return null;
}
