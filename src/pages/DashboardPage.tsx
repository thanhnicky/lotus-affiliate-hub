import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LinkIcon, MousePointerClick, PlusCircle, ShoppingBag, Wallet, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const allOrders = ordersQuery.data ?? [];

  // Build month options from the orders' created_at (yyyy-mm).
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    allOrders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      set.add(key);
    });
    return Array.from(set).sort().reverse();
  }, [allOrders]);

  // Build landing page options from the orders' landing_page_name.
  const landingPageOptions = useMemo(() => {
    const set = new Set<string>();
    allOrders.forEach((o) => {
      if (o.landing_page_name) set.add(o.landing_page_name);
    });
    return Array.from(set).sort();
  }, [allOrders]);

  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [landingPageFilter, setLandingPageFilter] = useState<string>("all");

  const filteredOrders = useMemo(() => {
    return allOrders.filter((o) => {
      if (monthFilter !== "all") {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (key !== monthFilter) return false;
      }
      if (landingPageFilter !== "all") {
        if ((o.landing_page_name ?? "") !== landingPageFilter) return false;
      }
      return true;
    });
  }, [allOrders, monthFilter, landingPageFilter]);

  const myOrders = filteredOrders.slice(0, 50);

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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Đơn hàng của bạn</h2>
          {allOrders.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Tháng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tháng</SelectItem>
                  {monthOptions.map((m) => {
                    const [y, mo] = m.split("-");
                    const label = `Tháng ${Number(mo)}/${y}`;
                    return (
                      <SelectItem key={m} value={m}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select value={landingPageFilter} onValueChange={setLandingPageFilter}>
                <SelectTrigger className="h-9 w-[200px]">
                  <SelectValue placeholder="Landing page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả landing page</SelectItem>
                  {landingPageOptions.map((lp) => (
                    <SelectItem key={lp} value={lp}>
                      {lp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(monthFilter !== "all" || landingPageFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    setMonthFilter("all");
                    setLandingPageFilter("all");
                  }}
                >
                  Xóa lọc
                </Button>
              )}
            </div>
          ) : null}
        </div>

        {ordersQuery.isError ? (
          <ErrorState onRetry={() => void ordersQuery.refetch()} />
        ) : ordersQuery.isLoading ? (
          <CardsSkeleton />
        ) : allOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-5 w-5" />}
            title="Chưa có đơn hàng nào"
            description="Khi khách đặt hàng qua link của bạn, đơn sẽ xuất hiện ở đây."
          />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-5 w-5" />}
            title="Không có đơn hàng phù hợp"
            description="Thử thay đổi bộ lọc tháng hoặc landing page."
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
                {order.commission_status === "cancelled" && order.notes ? (
                  <div className="mt-2 rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
                    <span className="font-medium">Lý do huỷ:</span> {order.notes}
                  </div>
                ) : null}
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
