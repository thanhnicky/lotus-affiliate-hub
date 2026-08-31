import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ExternalLink, Loader2, QrCode, Sparkles } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState, LoadingState } from "@/components/states";
import { SHARE_CHANNELS, linksService } from "@/services";
import type { AffiliateLink, LandingPage, ShareChannel } from "@/types";

export function CreateLinkPage() {
  const queryClient = useQueryClient();

  const [landingPageId, setLandingPageId] = useState("");
  const [channel, setChannel] = useState<ShareChannel | "">("");
  const [campaign, setCampaign] = useState("");
  const [created, setCreated] = useState<AffiliateLink | null>(null);
  const [showQr, setShowQr] = useState(false);

  const pagesQuery = useQuery({
    queryKey: ["landing-pages"],
    queryFn: () => linksService.listLandingPages(),
  });

  const createLink = useMutation({
    mutationFn: () =>
      linksService.createLink({
        landing_page_id: landingPageId,
        channel: channel as string,
        campaign_name: campaign.trim() || undefined,
      }),
    onSuccess: (link) => {
      setCreated(link);
      setShowQr(false);
      void queryClient.invalidateQueries({ queryKey: ["links"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Đã tạo link tiếp thị thành công!");
    },
    onError: (e: Error) => toast.error("Không tạo được link", { description: e.message }),
  });

  const canSubmit = Boolean(landingPageId && channel) && !createLink.isPending;
  const linkUrl = created?.affiliate_url || "";
  const pages = pagesQuery.data ?? [];
  const selectedPage = pages.find((p) => p.id === landingPageId);

  return (
    <AppLayout
      title="Tạo link bán hàng"
      description="Chọn sản phẩm và kênh chia sẻ, hệ thống sẽ tạo link tiếp thị riêng cho bạn."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {/* Landing page thumbnails */}
          {pagesQuery.isError ? (
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
              <ErrorState onRetry={() => void pagesQuery.refetch()} />
            </div>
          ) : pagesQuery.isLoading ? (
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
              <LoadingState label="Đang tải danh sách landing page..." />
            </div>
          ) : (
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-semibold">Chọn landing page</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {pages.map((p) => (
                  <LandingPageCard
                    key={p.id}
                    page={p}
                    selected={p.id === landingPageId}
                    onSelect={() => setLandingPageId(p.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Channel + campaign form */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) createLink.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="channel">Kênh chia sẻ</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as ShareChannel)}>
                  <SelectTrigger id="channel" className="h-12">
                    <SelectValue placeholder="Chọn kênh chia sẻ" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHARE_CHANNELS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign">Tên chiến dịch (tuỳ chọn)</Label>
                <Input
                  id="campaign"
                  className="h-12"
                  placeholder="vd: khuyen-mai-thang-9"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Dùng để phân biệt các đợt chia sẻ khác nhau trong báo cáo.
                </p>
              </div>

              <Button type="submit" className="h-12 w-full sm:w-auto sm:px-8" disabled={!canSubmit}>
                {createLink.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Tạo link
              </Button>
            </form>
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Link của bạn</h2>
          {!created || !linkUrl ? (
            <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-border p-8 text-center">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                Link tiếp thị sẽ hiển thị tại đây sau khi bạn bấm "Tạo link".
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <code className="block break-all rounded-xl bg-muted px-4 py-3 text-xs">
                {linkUrl}
              </code>
              <div className="flex flex-wrap gap-2">
                <CopyButton value={linkUrl} withText label="Sao chép link" variant="default" />
                <Button variant="outline" onClick={() => setShowQr((v) => !v)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  {showQr ? "Ẩn QR code" : "Tạo QR code"}
                </Button>
              </div>
              {showQr ? (
                <div className="flex justify-center rounded-2xl bg-background p-5">
                  <QRCodeCanvas value={linkUrl} size={180} includeMargin />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

/** A selectable thumbnail card for a landing page. */
function LandingPageCard({
  page,
  selected,
  onSelect,
}: {
  page: LandingPage;
  selected: boolean;
  onSelect: () => void;
}) {
  const thumbnail = page.thumbnail_url;
  const previewUrl = page.base_url ?? "";

  return (
    <div
      className={
        selected
          ? "cursor-pointer overflow-hidden rounded-2xl border-2 border-primary bg-card shadow-card transition hover:shadow-lift"
          : "cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition hover:border-primary/50 hover:shadow-lift"
      }
      onClick={onSelect}
    >
      {/* Thumbnail image or placeholder */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={page.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-2xl font-display font-bold text-primary/30">
              {page.name.charAt(0)}
            </span>
          </div>
        )}
        {/* Selected checkmark overlay */}
        {selected ? (
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="h-4 w-4" />
          </div>
        ) : null}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="line-clamp-1 font-medium text-sm">{page.name}</p>
        {page.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{page.description}</p>
        ) : null}
        {previewUrl ? (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Xem trước
          </a>
        ) : null}
      </div>
    </div>
  );
}
