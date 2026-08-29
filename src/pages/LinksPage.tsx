import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LinkIcon, PlusCircle, Search } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardsSkeleton, EmptyState, ErrorState } from "@/components/states";
import { useAuth } from "@/hooks/useAuth";
import { CHANNEL_LABEL, SHARE_CHANNELS, linksService } from "@/services";
import { formatDate, formatNumber, formatVnd } from "@/lib/format";

const ALL = "all";

export function LinksPage() {
  const { affiliate } = useAuth();
  const affiliateId = affiliate?.id;
  const [q, setQ] = useState("");
  const [page, setPage] = useState(ALL);
  const [channel, setChannel] = useState(ALL);

  const pagesQuery = useQuery({
    queryKey: ["landing-pages"],
    queryFn: () => linksService.listLandingPages(),
  });

  const linksQuery = useQuery({
    queryKey: ["links", affiliateId],
    queryFn: () => linksService.listLinks(affiliateId!),
    enabled: Boolean(affiliateId),
  });

  const keyword = q.trim().toLowerCase();
  const filtered = (linksQuery.data ?? []).filter((l) => {
    if (page !== ALL && l.landing_page_id !== page) return false;
    if (channel !== ALL && l.channel !== channel) return false;
    if (!keyword) return true;
    const channelLabel = CHANNEL_LABEL[l.channel] || l.channel;
    const campaignStr = l.campaign_name || "";
    return `${l.landing_page_name ?? ""} ${channelLabel} ${campaignStr}`
      .toLowerCase()
      .includes(keyword);
  });

  return (
    <AppLayout
      title="Link của tôi"
      description="Toàn bộ link tiếp thị bạn đã tạo cùng hiệu quả từng link."
      actions={
        <Button asChild className="h-11">
          <Link to="/create-link">
            <PlusCircle className="mr-2 h-4 w-4" />
            Tạo link mới
          </Link>
        </Button>
      }
    >
      <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo sản phẩm, kênh, chiến dịch"
            className="h-12 pl-9"
          />
        </div>
        <Select value={page} onValueChange={setPage}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Landing page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả landing page</SelectItem>
            {(pagesQuery.data ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Kênh chia sẻ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả kênh</SelectItem>
            {SHARE_CHANNELS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {linksQuery.isError ? (
        <ErrorState onRetry={() => void linksQuery.refetch()} />
      ) : linksQuery.isLoading ? (
        <CardsSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<LinkIcon className="h-5 w-5" />}
          title={keyword || page !== ALL || channel !== ALL ? "Không tìm thấy link phù hợp" : "Bạn chưa tạo link nào"}
          description={
            keyword || page !== ALL || channel !== ALL
              ? "Thử xoá bớt bộ lọc hoặc từ khoá tìm kiếm."
              : "Tạo link đầu tiên để bắt đầu theo dõi hiệu quả bán hàng."
          }
          action={
            <Button asChild>
              <Link to="/create-link">Tạo link mới</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {filtered.map((l) => {
            const linkUrl = l.affiliate_url || "";
            return (
              <li key={l.id} className="rounded-2xl border border-border/70 bg-card p-4 shadow-card md:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{l.landing_page_name || "Sơn Lotus"}</span>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                    {CHANNEL_LABEL[l.channel] || l.channel}
                  </span>
                  {l.campaign_name ? (
                    <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                      {l.campaign_name}
                    </span>
                  ) : null}
                  <span className="ml-auto text-xs text-muted-foreground">
                    Tạo ngày {formatDate(l.created_at)}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="Click" value={formatNumber(l.clicks ?? 0)} />
                  <Metric label="Chuyển đổi" value={formatNumber(l.conversions ?? 0)} />
                  <Metric label="Tổng doanh thu" value={formatVnd(l.total_revenue ?? 0)} />
                  <Metric label="Hoa hồng" value={formatVnd(l.commission ?? 0)} />
                </dl>

                <div className="mt-4 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2 text-xs">
                    {linkUrl}
                  </code>
                  <CopyButton value={linkUrl} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold">{value}</dd>
    </div>
  );
}

