import { useQuery } from "@tanstack/react-query";
import {
  Download,
  FileText,
  ImageIcon,
  Video,
  Lightbulb,
  ExternalLink,
  Sparkles,
} from "lucide-react";

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
              Mỗi CTV một phiên bản khác nhau — Facebook, Zalo, TikTok không flag duplicate.
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
              "Export 1080p, dọc 9:16 cho TikTok/Reels",
            ]}
          />
          <GuideCard
            icon={<Lightbulb className="h-5 w-5" />}
            title="Bài viết Facebook kèm ảnh"
            description="Đăng bài với ảnh sản phẩm + hook câu khách."
            steps={[
              "Tải ảnh HD sản phẩm về",
              "Viết hook: câu hỏi trúng nỗi đau khách (vd: nhà mới sơn bị mốc?)",
              "Giới thiệu sản phẩm + 2 tính năng chính",
              "Gắn link affiliate của bạn ở cuối bài",
              "Hashtag: #sonlotus #sonnoithat #thietkenha",
            ]}
          />
        </div>
      </section>

      {/* Prompt library */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">Prompt AI sẵn dùng</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Copy prompt này vào ChatGPT / Claude / Gemini để tạo script video.
        </p>

        <div className="mt-6 space-y-4">
          <PromptCard
            title="Script video TikTok 30s — Sơn nội thất"
            prompt={`Bạn là chuyên gia content TikTok. Viết script video 30 giây giới thiệu sơn nội thất Lotus Premium cho cộng tác viên bán hàng.

Yêu cầu:
- Hook 3 giây đầu gây tò mò
- 3 tính năng chính: lau chùi dễ, an toàn gia đình, bền màu
- Giọng điệu gần gũi, tự nhiên, không như quảng cáo
- Kết thúc: kêu gọi click link bio

Format: [Giây] [Hình ảnh] [Voice/Text]`}
          />
          <PromptCard
            title="Bài đăng Facebook — Sơn ngoại thất"
            prompt={`Viết bài đăng Facebook 150 từ giới thiệu sơn ngoại thất Lotus Weather Shield.

Đối tượng: chủ nhà đang xây/sửa nhà ở miền Nam (nắng mưa nhiều)
Giọng điệu: chia sẻ kinh nghiệm, như người trong ngành
Nội dung:
- Mở: vấn đề sơn ngoại thất dễ bong tróc sau 2-3 năm
- Giải pháp: Lotus Weather Shield chống nắng mưa, bền màu 10 năm
- Kêu gọi: inbox hoặc click link để được tư vấn

Kết thúc bằng 3 hashtag liên quan.`}
          />
          <PromptCard
            title="Kịch bản video ngắn — Chống thấm Lotus"
            prompt={`Viết kịch bản video 45 giây về sơn chống thấm Lotus Max.

Bối cảnh: quay thực tế tường bị thấm, sau khi xử lý
Cấu trúc:
1. Vấn đề (10s): tường mốc, bong tróc, ố vàng
2. Nguyên nhân (10s): thấm từ ngoài vào, không xử lý gốc
3. Giải pháp (15s): Lotus Max chống thấm ngược, áp dụng cho tường + sân thượng
4. Kết quả (5s): tường khô, sạch
5. CTA (5s): click link để mua

Viết ngắn gọn, dễ quay bằng điện thoại.`}
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

/** Prompt card with copy button */
function PromptCard({ title, prompt }: { title: string; prompt: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(prompt);
          }}
        >
          <Download className="mr-1.5 h-4 w-4" />
          Copy
        </Button>
      </div>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
        {prompt}
      </pre>
    </div>
  );
}
