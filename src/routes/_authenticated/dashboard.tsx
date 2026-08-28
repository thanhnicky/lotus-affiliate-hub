import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, LinkIcon, MousePointerClick, PlusCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { RequireActive } from "@/components/RequireActive";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Tổng quan cộng tác viên | Sơn Lotus" },
      {
        name: "description",
        content: "Theo dõi số link tiếp thị, lượt click và hiệu quả bán sơn Lotus của bạn.",
      },
      { property: "og:title", content: "Tổng quan cộng tác viên | Sơn Lotus" },
      { property: "og:description", content: "Theo dõi hiệu quả bán sơn Lotus của bạn." },
    ],
  }),
  component: () => (
    <RequireActive>
      <DashboardPage />
    </RequireActive>
  ),
});

function DashboardPage() {
  const { data: profile } = useProfile();

  const { data: links } = useQuery({
    queryKey: ["links", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("id, full_url, channel, campaign, clicks, created_at, landing_pages(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalLinks = links?.length ?? 0;
  const totalClicks = links?.reduce((sum, l) => sum + (l.clicks ?? 0), 0) ?? 0;

  return (
    <AppShell
      title={`Xin chào, ${profile?.full_name || "cộng tác viên"} 👋`}
      description="Đây là bảng tổng quan hoạt động tiếp thị sơn Lotus của bạn."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Sparkles className="h-5 w-5" />}
          label="Mã cộng tác viên"
          value={profile?.affiliate_code ?? "—"}
          onCopy={() => {
            if (!profile) return;
            void navigator.clipboard.writeText(profile.affiliate_code);
            toast.success("Đã sao chép mã CTV");
          }}
        />
        <StatCard icon={<LinkIcon className="h-5 w-5" />} label="Link đã tạo" value={totalLinks} />
        <StatCard
          icon={<MousePointerClick className="h-5 w-5" />}
          label="Tổng lượt click"
          value={totalClicks}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl bg-brand p-6 text-primary-foreground shadow-lift md:p-8">
        <h2 className="font-display text-xl font-semibold md:text-2xl">Sẵn sàng bán hàng?</h2>
        <p className="mt-2 max-w-lg text-sm opacity-90">
          Chọn 1 trong 4 landing page sản phẩm sơn Lotus, chọn kênh chia sẻ và nhận link tiếp thị
          riêng của bạn chỉ trong vài giây.
        </p>
        <Button asChild variant="secondary" className="mt-5 h-12 px-6 text-base">
          <Link to="/create-link">
            <PlusCircle className="mr-2 h-5 w-5" />
            Tạo link mới
          </Link>
        </Button>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Link gần đây</h2>
          <Link to="/links" className="text-sm font-medium text-primary hover:underline">
            Xem tất cả
          </Link>
        </div>

        {totalLinks === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Bạn chưa tạo link nào. Hãy bắt đầu với link đầu tiên nhé!
          </div>
        ) : (
          <ul className="space-y-3">
            {links?.slice(0, 5).map((link) => (
              <li
                key={link.id}
                className="rounded-2xl border border-border/70 bg-card p-4 shadow-card"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {(link.landing_pages as { name: string } | null)?.name ?? "Landing page"}
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                    {link.channel}
                  </span>
                  {link.campaign ? (
                    <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                      {link.campaign}
                    </span>
                  ) : null}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {link.clicks} lượt click
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2 text-xs">
                    {link.full_url}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Sao chép link"
                    onClick={() => {
                      void navigator.clipboard.writeText(link.full_url);
                      toast.success("Đã sao chép link");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  onCopy?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="font-display text-2xl font-semibold tracking-tight">{value}</span>
        {onCopy ? (
          <Button size="icon" variant="ghost" onClick={onCopy} aria-label="Sao chép">
            <Copy className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
