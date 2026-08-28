import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Loader2, Share2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { RequireActive } from "@/components/RequireActive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/create-link")({
  head: () => ({
    meta: [
      { title: "Tạo link tiếp thị | Cộng tác viên sơn Lotus" },
      {
        name: "description",
        content:
          "Chọn landing page sơn Lotus, kênh chia sẻ và chiến dịch để tạo link tiếp thị riêng của bạn.",
      },
      { property: "og:title", content: "Tạo link tiếp thị | Cộng tác viên sơn Lotus" },
      { property: "og:description", content: "Tạo link tiếp thị sơn Lotus trong vài giây." },
    ],
  }),
  component: () => (
    <RequireActive>
      <CreateLinkPage />
    </RequireActive>
  ),
});

const CHANNELS = [
  { value: "facebook", label: "Facebook" },
  { value: "zalo", label: "Zalo" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "sms", label: "Tin nhắn / SMS" },
  { value: "offline", label: "Gặp trực tiếp" },
];

function CreateLinkPage() {
  const queryClient = useQueryClient();
  const [pageId, setPageId] = useState<string | null>(null);
  const [channel, setChannel] = useState<string>("facebook");
  const [campaign, setCampaign] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const { data: pages, isLoading } = useQuery({
    queryKey: ["landing_pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("id, name, description, slug")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const createLink = useMutation({
    mutationFn: async () => {
      if (!pageId) throw new Error("Vui lòng chọn landing page");
      const { data, error } = await supabase.rpc("create_affiliate_link", {
        p_landing_page_id: pageId,
        p_channel: channel,
        p_campaign: campaign,
      });
      if (error) throw error;
      return data as { full_url: string };
    },
    onSuccess: (data) => {
      setResult(data.full_url);
      setCampaign("");
      void queryClient.invalidateQueries({ queryKey: ["links"] });
      toast.success("Đã tạo link thành công!");
    },
    onError: (error: Error) => {
      toast.error("Không tạo được link", { description: error.message });
    },
  });

  return (
    <AppShell
      title="Tạo link tiếp thị"
      description="Chọn sản phẩm, kênh chia sẻ và bấm tạo link. Rất đơn giản!"
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Bước 1 · Chọn landing page
            </h2>
            {isLoading ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                Đang tải danh sách sản phẩm...
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {pages?.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setPageId(page.id)}
                    className={cn(
                      "rounded-2xl border bg-card p-4 text-left shadow-card transition-all",
                      pageId === page.id
                        ? "border-primary ring-2 ring-primary/25"
                        : "border-border/70 hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{page.name}</span>
                      {pageId === page.id ? (
                        <Check className="h-5 w-5 shrink-0 text-primary" />
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{page.description}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Bước 2 · Chọn kênh chia sẻ
            </h2>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setChannel(c.value)}
                  className={cn(
                    "rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                    channel === c.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Bước 3 · Chiến dịch (không bắt buộc)
            </h2>
            <Label htmlFor="campaign" className="text-sm font-normal text-muted-foreground">
              Ví dụ: khuyen-mai-thang-9
            </Label>
            <Input
              id="campaign"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="Nhập tên chiến dịch nếu có"
              className="h-12 max-w-md"
            />
          </section>

          <Button
            className="h-12 w-full text-base sm:w-auto sm:px-8"
            disabled={!pageId || createLink.isPending}
            onClick={() => createLink.mutate()}
          >
            {createLink.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Tạo link của tôi
          </Button>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 text-primary">
              <Share2 className="h-5 w-5" />
              <h2 className="font-display text-lg font-semibold">Link của bạn</h2>
            </div>
            {result ? (
              <>
                <code className="mt-4 block break-all rounded-xl bg-muted p-3 text-xs leading-relaxed">
                  {result}
                </code>
                <Button
                  className="mt-4 h-12 w-full"
                  onClick={() => {
                    void navigator.clipboard.writeText(result);
                    toast.success("Đã sao chép link");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Sao chép link
                </Button>
              </>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Link tiếp thị sẽ hiện ở đây sau khi bạn bấm “Tạo link của tôi”. Mỗi link đã gắn sẵn
                mã cộng tác viên của bạn để hệ thống ghi nhận doanh số.
              </p>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
