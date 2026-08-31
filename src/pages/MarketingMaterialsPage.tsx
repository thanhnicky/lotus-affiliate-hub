import { useQuery } from "@tanstack/react-query";
import { FileText, ImageIcon, Video, Lightbulb, ExternalLink, Sparkles } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState, EmptyState } from "@/components/states";
import { linksService } from "@/services";

export function MarketingMaterialsPage() {
  const pagesQuery = useQuery({
    queryKey: ["landing-pages"],
    queryFn: () => linksService.listLandingPages(),
  });
  const landingPages = pagesQuery.data ?? [];

  return (
    <AppLayout
      title="Tài liệu marketing"
      description="Tải ảnh, video và thông tin sản phẩm để tự tạo content bán hàng riêng của bạn."
    >
      {/* Intro */}
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold">
              Tạo content riêng, không bị trùng
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Tải ảnh và video raw về, dùng CapCut / Canva AI để cắt ghép thành video của riêng bạn.
              Mỗi CTV một phiên bản khác nhau — Facebook, Zalo, Reels không flag duplicate.
            </p>
          </div>
        </div>
      </div>

      {/* Materials by product */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Tài liệu theo sản phẩm</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mỗi sản phẩm có ảnh, video raw và thông số kỹ thuật. Bấm "Tải về" để lưu máy.
        </p>

        <div className="mt-6 space-y-6">
          {pagesQuery.isError ? (
            <ErrorState onRetry={() => void pagesQuery.refetch()} />
          ) : pagesQuery.isLoading ? (
            <LoadingState label="Đang tải danh sách sản phẩm..." />
          ) : landingPages.length === 0 ? (
            <EmptyState
              icon={<ImageIcon className="h-5 w-5" />}
              title="Chưa có tài liệu"
              description="Lotus sẽ cập nhật tài liệu marketing sớm."
            />
          ) : (
            landingPages.map((p) => (
              <ProductMaterialCard
                key={p.id}
                name={p.name}
                description={p.description ?? ""}
                thumbnailUrl={p.thumbnail_url ?? null}
                previewUrl={p.base_url ?? ""}
              />
            ))
          )}
        </div>
      </section>

      {/* Content guides */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">Hướng dẫn tạo content</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Prompt và script mẫu để bạn dùng với AI tạo video nhanh.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <GuideCard
            icon={<Video className="h-5 w-5" />}
            title="Video review 30 giây"
            description="Quay sản phẩm + voice over. Dùng CapCut AI tạo subtitle tự động."
            steps={[
              "Tải 3-5 ảnh/video raw sản phẩm về máy",
              "Mở CapCut → New Project → thêm ảnh/video",
              "Thêm text: tên sản phẩm + 1 tính năng nổi bật",
              "Thêm voice (ghi âm hoặc AI voice)",
              "Export 1080p, dọc 9:16 cho Reels/Shorts",
            ]}
          />
          <GuideCard
            icon={<Lightbulb className="h-5 w-5" />}
            title="Bài viết Facebook kèm ảnh"
            description="Đăng bài với ảnh sản phẩm + hook câu khách."
            steps={[
              "Tải ảnh HD sản phẩm về",
              "Viết hook: câu hỏi trúng nỗi đau khách",
              "Giới thiệu sản phẩm + 2 tính năng chính",
              "Gắn link affiliate của bạn ở cuối bài",
              "Hashtag: #sonlotus #songo #songiago #sonsatkhongmui",
            ]}
          />
        </div>
      </section>
    </AppLayout>
  );
}

/** Material card for one product — shows thumbnail + download buttons */
function ProductMaterialCard({
  name,
  description,
  thumbnailUrl,
  previewUrl,
}: {
  name: string;
  description: string;
  thumbnailUrl: string | null;
  previewUrl: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
      <div className="grid gap-0 sm:grid-cols-[200px_1fr]">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted sm:aspect-square">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/8 to-primary/3">
              <span className="text-3xl font-display font-bold text-primary/20">
                {name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Info + downloads */}
        <div className="p-4 sm:p-5">
          <h3 className="font-display text-base font-semibold leading-snug">{name}</h3>
          {description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled>
              <ImageIcon className="mr-1.5 h-4 w-4" />
              Ảnh HD
              <span className="ml-1.5 text-xs text-muted-foreground">(sắp có)</span>
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Video className="mr-1.5 h-4 w-4" />
              Video raw
              <span className="ml-1.5 text-xs text-muted-foreground">(sắp có)</span>
            </Button>
            <Button variant="outline" size="sm" disabled>
              <FileText className="mr-1.5 h-4 w-4" />
              Thông số
              <span className="ml-1.5 text-xs text-muted-foreground">(sắp có)</span>
            </Button>
            {previewUrl ? (
              <Button asChild variant="ghost" size="sm">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Xem trang sản phẩm
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Step-by-step guide card */
function GuideCard({
  icon,
  title,
  description,
  steps,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  steps: string[];
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <h3 className="font-display text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <ol className="mt-4 space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2.5 text-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {i + 1}
            </span>
            <span className="leading-relaxed text-muted-foreground">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
