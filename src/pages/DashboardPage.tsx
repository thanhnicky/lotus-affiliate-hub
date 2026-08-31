import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LinkIcon, MousePointerClick, PlusCircle, ShoppingBag, Wallet, Clock } from "lucide-react";
import type { ReactNode } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardsSkeleton, EmptyState, ErrorState } from "@/components/states";
import { useAuth } from "@/hooks/useAuth";
import { CHANNEL_LABEL, COMMISSION_STATUS_LABEL, linksService, ordersService } from "@/services";
import { formatDate, formatNumber, formatVnd } from "@/lib/format";
import type { CommissionStatus, Order } from "@/types";

const STATUS_BADGE: Record<CommissionStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground",
  approved: "bg-success/15 text-success-foreground",
  paid: "bg-success/15 text-success-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  fraud: "bg-destructive/10 text-destructive",
};

/** Mask all but the last 3 digits of a phone number: 0912345678 -> *******678 */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 3) return "***";
  return "*".repeat(digits.length - 3) + digits.slice(-3);
}

/** Extract just the province/city name from a full address.
 *  Vietnamese addresses typically end with the province/city, often after a
 *  comma. If no comma, return the whole string (assume it's already just the
 *  province as the OrderForm captures). */
function maskAddress(address: string): string {
  if (!address) return "";
  const parts = address.split(",").map((p) => p.trim());
  // Return the last non-empty segment (the province/city).
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (part) return part;
  }
  return "";
}

export function DashboardPage() {
  const { affiliate } = useAuth();
  const affiliateId = affiliate?.id;

  const statsQuery = useQuery({
    queryKey: ["stats", affiliateId],
    queryFn: () => linksService.getDashboardStats(affiliateId!),
    enabled: Boolean(affiliateId),
  });

  const linksQuery = useQuery({
    queryKey: ["links", affiliateId],
    queryFn: () => linksService.listLinks(affiliateId!),
    enabled: Boolean(affiliateId),
  });

  const ordersQuery = useQuery({
    queryKey: ["my-orders", affiliateId],
    queryFn: () => ordersService.listMyOrders(affiliateId!),
    enabled: Boolean(affiliateId),
  });

  const stats = statsQuery.data;
  const recent = (linksQuery.data ?? []).slice(0, 5);
  const myOrders = (ordersQuery.data ?? []).slice(0, 10);

  return (
    <AppLayout
      title={`Xin chào, ${affiliate?.full_name?.split(" ").slice(-1)[0] || "cộng tác viên"} 👋`}
      description="Theo dõi hiệu quả tiếp thị sơn Lotus của bạn."
      actions={
        <Button asChild className="h-11">
          <Link to="/create-link">
            <PlusCircle className="mr-2 h-4 w-4" />
            Tạo link bán hàng
          </Link>
        </Button>
      }
    >
      {statsQuery.isError ? (
        <ErrorState onRetry={() => void statsQuery.refetch()} />
      ) : statsQuery.isLoading ? (
        <CardsSkeleton count={2} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<MousePointerClick className="h-4 w-4" />}
            label="Lượt click"
            value={formatNumber(stats?.clicks ?? 0)}
          />
          <StatCard
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Đơn hàng"
            value={formatNumber(stats?.orders ?? 0)}
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Hoa hồng chờ duyệt"
            value={formatVnd(stats?.pending_commission ?? 0)}
          />
          <StatCard
            icon={<Wallet className="h-4 w-4" />}
            label="Hoa hồng có thể rút"
            value={formatVnd(stats?.available_commission ?? 0)}
            highlight
          />
        </div>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Link gần đây</h2>
          <Link to="/links" className="text-sm font-medium text-primary hover:underline">
            Xem tất cả
          </Link>
        </div>

        {linksQuery.isError ? (
          <ErrorState onRetry={() => void linksQuery.refetch()} />
        ) : linksQuery.isLoading ? (
          <CardsSkeleton />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={<LinkIcon className="h-5 w-5" />}
            title="Bạn chưa tạo link nào"
            description="Chọn landing page và kênh chia sẻ để nhận link tiếp thị riêng của bạn."
            action={
              <Button asChild>
                <Link to="/create-link">Tạo link đầu tiên</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-3">
            {recent.map((link) => {
              const url = link.affiliate_url || "";
              return (
                <li
                  key={link.id}
                  className="rounded-2xl border border-border/70 bg-card p-4 shadow-card"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{link.landing_page_name || "Sơn Lotus"}</span>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                      {CHANNEL_LABEL[link.channel] || link.channel}
                    </span>
                    {link.campaign_name ? (
                      <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                        {link.campaign_name}
                      </span>
                    ) : null}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(link.created_at)} · {formatNumber(link.clicks ?? 0)} click
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2 text-xs">
                      {url}
                    </code>
                    <CopyButton value={url} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Đơn hàng của bạn</h2>
        </div>

        {ordersQuery.isError ? (
          <ErrorState onRetry={() => void ordersQuery.refetch()} />
        ) : ordersQuery.isLoading ? (
          <CardsSkeleton />
        ) : myOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-5 w-5" />}
            title="Chưa có đơn hàng nào"
            description="Khi khách đặt hàng qua link của bạn, đơn sẽ xuất hiện ở đây."
          />
        ) : (
          <ul className="grid gap-3">
            {myOrders.map((order) => (
              <li
                key={order.id}
                className="rounded-2xl border border-border/70 bg-card p-4 shadow-card"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-base font-semibold">
                    {formatVnd(order.final_amount)}
                  </span>
                  {order.commission_status ? (
                    <Badge className={STATUS_BADGE[order.commission_status]}>
                      {COMMISSION_STATUS_LABEL[order.commission_status]}
                    </Badge>
                  ) : null}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDate(order.created_at)}
                  </span>
                </div>
                <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                  <span>
                    Khách: {order.customer_name} · {maskPhone(order.customer_phone)}
                  </span>
                  <span>Khu vực: {maskAddress(order.shipping_address ?? "") || "—"}</span>
                  <span>
                    Hoa hồng: {formatVnd(order.commission_amount ?? 0)}
                    {order.commission_rate !== null
                      ? ` (${(order.commission_rate * 100).toFixed(1).replace(/\.0$/, "")}%)`
                      : ""}
                  </span>
                  <span>Landing page: {order.landing_page_name ?? "—"}</span>
                  <span className="truncate">Mã đơn: {order.order_code}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl bg-brand p-5 text-primary-foreground shadow-lift"
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
    </div>
  );
}
