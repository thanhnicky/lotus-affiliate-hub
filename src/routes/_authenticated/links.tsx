import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, PlusCircle, Search } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { RequireActive } from "@/components/RequireActive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/links")({
  head: () => ({
    meta: [
      { title: "Link của tôi | Cộng tác viên sơn Lotus" },
      {
        name: "description",
        content: "Danh sách toàn bộ link tiếp thị sơn Lotus bạn đã tạo cùng số lượt click.",
      },
      { property: "og:title", content: "Link của tôi | Cộng tác viên sơn Lotus" },
      { property: "og:description", content: "Quản lý link tiếp thị sơn Lotus của bạn." },
    ],
  }),
  component: () => (
    <RequireActive>
      <LinksPage />
    </RequireActive>
  ),
});

function LinksPage() {
  const [q, setQ] = useState("");

  const { data: links, isLoading } = useQuery({
    queryKey: ["links", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("id, full_url, channel, campaign, clicks, created_at, landing_pages(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const keyword = q.trim().toLowerCase();
  const filtered = (links ?? []).filter((l) => {
    if (!keyword) return true;
    const name = (l.landing_pages as { name: string } | null)?.name ?? "";
    return `${name} ${l.channel} ${l.campaign}`.toLowerCase().includes(keyword);
  });

  return (
    <AppShell
      title="Link của tôi"
      description="Tất cả link tiếp thị bạn đã tạo. Bấm sao chép để chia sẻ ngay."
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo sản phẩm, kênh hoặc chiến dịch"
            className="h-12 pl-9"
          />
        </div>
        <Button asChild className="h-12">
          <Link to="/create-link">
            <PlusCircle className="mr-2 h-4 w-4" />
            Tạo link mới
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải danh sách link...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {keyword ? "Không tìm thấy link phù hợp." : "Bạn chưa tạo link nào."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((link) => (
            <li
              key={link.id}
              className="rounded-2xl border border-border/70 bg-card p-4 shadow-card md:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">
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
                  {new Date(link.created_at).toLocaleDateString("vi-VN")} · {link.clicks} click
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
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
    </AppShell>
  );
}
