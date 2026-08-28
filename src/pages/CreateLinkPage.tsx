import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, QrCode, Sparkles } from "lucide-react";

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
import { useProfile } from "@/hooks/useAuth";
import { SHARE_CHANNELS, linksService } from "@/services";
import type { AffiliateLink, ShareChannel } from "@/types";

export function CreateLinkPage() {
  const { session } = useProfile();
  const userId = session?.user_id;
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
      linksService.createLink(userId!, {
        landing_page_id: landingPageId,
        channel: channel as ShareChannel,
        campaign,
      }),
    onSuccess: (link) => {
      setCreated(link);
      setShowQr(false);
      void queryClient.invalidateQueries({ queryKey: ["links"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Đã tạo link tiếp thị");
    },
    onError: (e: Error) => toast.error("Không tạo được link", { description: e.message }),
  });

  const canSubmit = Boolean(landingPageId && channel) && !createLink.isPending;

  return (
    <AppLayout
      title="Tạo link bán hàng"
      description="Chọn sản phẩm và kênh chia sẻ, hệ thống sẽ tạo link tiếp thị riêng cho bạn."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
          {pagesQuery.isError ? (
            <ErrorState onRetry={() => void pagesQuery.refetch()} />
          ) : pagesQuery.isLoading ? (
            <LoadingState label="Đang tải danh sách landing page..." />
          ) : (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) createLink.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="landing">Landing page sản phẩm</Label>
                <Select value={landingPageId} onValueChange={setLandingPageId}>
                  <SelectTrigger id="landing" className="h-12">
                    <SelectValue placeholder="Chọn landing page" />
                  </SelectTrigger>
                  <SelectContent>
                    {(pagesQuery.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} · {p.product_line}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
          )}
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Link của bạn</h2>
          {!created ? (
            <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-border p-8 text-center">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                Link tiếp thị sẽ hiển thị tại đây sau khi bạn bấm “Tạo link”.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <code className="block break-all rounded-xl bg-muted px-4 py-3 text-xs">
                {created.full_url}
              </code>
              <div className="flex flex-wrap gap-2">
                <CopyButton value={created.full_url} withText label="Sao chép link" variant="default" />
                <Button variant="outline" onClick={() => setShowQr((v) => !v)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  {showQr ? "Ẩn QR code" : "Tạo QR code"}
                </Button>
              </div>
              {showQr ? (
                <div className="flex justify-center rounded-2xl bg-background p-5">
                  <QRCodeCanvas value={created.full_url} size={180} includeMargin />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
