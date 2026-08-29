import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LinkIcon,
  MousePointerClick,
  PlusCircle,
  ShoppingBag,
  UserPlus,
  Wallet,
  Clock,
} from "lucide-react";
import type { ReactNode } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { CardsSkeleton, EmptyState, ErrorState } from "@/components/states";
import { useAuth } from "@/hooks/useAuth";
import { CHANNEL_LABEL, linksService } from "@/services";
import { formatDate, formatNumber, formatVnd } from "@/lib/format";

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

  const stats = statsQuery.data;
  const recent = (linksQuery.data ?? []).slice(0, 5);

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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<MousePointerClick className="h-4 w-4" />}
            label="Lượt click"
            value={formatNumber(stats?.clicks ?? 0)}
          />
          <StatCard
            icon={<UserPlus className="h-4 w-4" />}
            label="Lead"
            value={formatNumber(stats?.leads ?? 0)}
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
                <li key={link.id} className="rounded-2xl border border-border/70 bg-card p-4 shadow-card">
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
      <div className={highlight ? "flex items-center gap-2 opacity-90" : "flex items-center gap-2 text-muted-foreground"}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-3 font-display text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

