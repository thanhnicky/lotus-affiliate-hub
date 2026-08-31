import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShoppingBag, XCircle } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ErrorState, LoadingState, EmptyState } from "@/components/states";
import { ORDER_STATUS_LABEL, ordersService } from "@/services";
import { formatDate, formatVnd } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground",
  approved: "bg-success/15 text-success-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

function generateExternalReference() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AdminOrdersPage() {
  const queryClient = useQueryClient();

  const [affiliateCode, setAffiliateCode] = useState("");
  const [orderValue, setOrderValue] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [campaignSlug, setCampaignSlug] = useState("");

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
        external_reference: generateExternalReference(),
        affiliate_code: affiliateCode,
        order_value: Number(orderValue.replace(/\D/g, "")),
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        campaign_slug: campaignSlug.trim() || undefined,
      }),
    onSuccess: (order) => {
      setAffiliateCode("");
      setOrderValue("");
      setCustomerName("");
      setCustomerPhone("");
      setCampaignSlug("");
      invalidate();
      toast.success(
        order.affiliate_id
          ? `Đã tạo đơn hàng, hoa hồng ${formatVnd(order.commission_amount)} đang chờ duyệt`
          : "Đã tạo đơn hàng (không khớp cộng tác viên nào, không tính hoa hồng)",
      );
    },
    onError: (e: Error) => toast.error("Không tạo được đơn hàng", { description: e.message }),
  });

  const [processingId, setProcessingId] = useState<string | null>(null);
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersService.updateOrderStatus(id, status),
    onMutate: ({ id }) => setProcessingId(id),
    onSuccess: (order) => {
      invalidate();
      toast.success(order.status === "approved" ? "Đã duyệt đơn hàng" : "Đã từ chối đơn hàng");
    },
    onError: (e: Error) => toast.error("Không cập nhật được đơn hàng", { description: e.message }),
    onSettled: () => setProcessingId(null),
  });

  const canSubmit =
    Boolean(affiliateCode.trim()) &&
    Number(orderValue.replace(/\D/g, "")) > 0 &&
    !createOrder.isPending;

  const orders: Order[] = ordersQuery.data ?? [];
  const pending = orders.filter((o) => o.status === "pending");
  const resolved = orders.filter((o) => o.status !== "pending");

  return (
    <AppLayout
      title="Quản lý đơn hàng"
      description="Nhập đơn hàng thủ công và duyệt hoa hồng cho cộng tác viên."
    >
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
            <Label htmlFor="order-value">Giá trị đơn hàng (đ)</Label>
            <Input
              id="order-value"
              inputMode="numeric"
              className="h-12"
              placeholder="1680000"
              value={orderValue}
              onChange={(e) => setOrderValue(e.target.value)}
            />
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
            <Label htmlFor="customer-name">Tên khách hàng (tuỳ chọn)</Label>
            <Input
              id="customer-name"
              className="h-12"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone">SĐT khách hàng (tuỳ chọn)</Label>
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
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            disabled={processingId === order.id}
                            onClick={() =>
                              updateStatus.mutate({ id: order.id, status: "approved" })
                            }
                          >
                            {processingId === order.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processingId === order.id}
                            onClick={() =>
                              updateStatus.mutate({ id: order.id, status: "rejected" })
                            }
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Từ chối
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h2 className="mb-3 font-display text-lg font-semibold">Đã xử lý</h2>
                {resolved.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có đơn nào được duyệt/từ chối.
                  </p>
                ) : (
                  <ul className="grid gap-3">
                    {resolved.map((order) => (
                      <li
                        key={order.id}
                        className="rounded-2xl border border-border/70 bg-card p-4 shadow-card"
                      >
                        <OrderSummary order={order} />
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
          <span className="font-display text-lg font-semibold">{formatVnd(order.order_value)}</span>
          <Badge className={STATUS_BADGE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
          {!order.affiliate_id ? (
            <Badge variant="outline" className="text-muted-foreground">
              Không khớp CTV
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Mã CTV: {order.affiliate_code || "—"}
          {order.affiliate_id ? ` · Hoa hồng: ${formatVnd(order.commission_amount)}` : ""}
        </p>
        {order.customer_name || order.customer_phone ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {order.customer_name} {order.customer_phone ? `· ${order.customer_phone}` : ""}
          </p>
        ) : null}
      </div>
      <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
    </div>
  );
}
