import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Phone, Mail, MapPin, ExternalLink, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { LotusMark } from "@/components/LotusMark";
import { linksService } from "@/services";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cộng tác viên sơn Lotus — Hoa hồng 10% mỗi đơn hàng" },
      {
        name: "description",
        content:
          "Kiếm thu nhập 10% hoa hồng trên mỗi đơn hàng sơn Lotus giao thành công. Đăng ký miễn phí, tạo link tiếp thị, chia sẻ và nhận hoa hồng hàng tháng.",
      },
      { property: "og:title", content: "Cộng tác viên sơn Lotus — Hoa hồng 10%" },
      {
        property: "og:description",
        content:
          "Đăng ký làm cộng tác viên sơn Lotus: 10% hoa hồng mỗi đơn giao thành công, thanh toán hàng tháng, theo dõi minh bạch.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  {
    title: "Đăng ký",
    text: "Tạo tài khoản trong 2 phút. Xác nhận email là xong.",
  },
  {
    title: "Tạo link",
    text: "Chọn sản phẩm, chọn kênh. Nhận link gắn sẵn mã của bạn.",
  },
  {
    title: "Chia sẻ",
    text: "Gửi link cho ai cần sơn. Facebook, Zalo, TikTok — tùy bạn.",
  },
  {
    title: "Nhận tiền",
    text: "Đơn giao thành công → 10% hoa hồng. Thanh toán 1-5 hàng tháng.",
  },
];

const FAQS = [
  {
    q: "Tôi không rành kỹ thuật sơn, có làm được không?",
    a: "Có. Bạn chỉ cần giới thiệu khách đúng nhu cầu; Lotus hỗ trợ tư vấn hệ sơn, màu sắc, quy trình và báo giá.",
  },
  {
    q: "Tôi có phải nhập hàng hoặc giao hàng không?",
    a: "Không. Lotus xử lý tư vấn, xác nhận đơn, giao hàng và hậu mãi; CTV tập trung kết nối khách hàng.",
  },
  {
    q: "Khi nào tôi nhận được hoa hồng?",
    a: "Hoa hồng được ghi nhận khi đơn giao thành công, sau đó được duyệt và thanh toán theo lịch từ ngày 1 đến ngày 5 hằng tháng.",
  },
  {
    q: "Tôi bán qua kênh nào?",
    a: "Bạn có thể chia sẻ link qua Facebook, Zalo, TikTok hoặc các kênh cá nhân phù hợp; không chạy quảng cáo trả phí nếu chưa được Lotus cho phép.",
  },
];

const PRODUCTS_FALLBACK = [
  { name: "Sơn nội thất Lotus Premium", desc: "Lau chùi dễ dàng, an toàn cho gia đình" },
  { name: "Sơn ngoại thất Weather Shield", desc: "Chống nắng mưa, bền màu 10 năm" },
  { name: "Sơn lót chống kiềm Lotus", desc: "Tăng độ bám dính, ngăn kiềm hoá" },
  { name: "Chống thấm Lotus Max", desc: "Giải pháp chống thấm tường, sân thượng" },
];

function Home() {
  const pagesQuery = useQuery({
    queryKey: ["landing-pages"],
    queryFn: () => linksService.listLandingPages(),
  });
  const landingPages = pagesQuery.data ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-soft">
      {/* ===== Header ===== */}
      <header className="mx-auto flex h-20 w-full max-w-5xl items-center px-4">
        <Link to="/" className="flex items-center">
          <LotusMark className="h-11 w-auto" />
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Đăng nhập</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/register">Đăng ký</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24">
        {/* ===== Hero ===== */}
        <section className="pt-12 md:pt-24">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Chương trình cộng tác viên
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
            Giới thiệu sơn Lotus.
            <br />
            <span className="text-muted-foreground">Nhận </span>10% hoa hồng.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Chia sẻ link sản phẩm với mạng lưới của bạn. Mỗi đơn giao thành công — bạn nhận 10%.
            Không nhập hàng, không giao hàng, không rủi ro.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 px-7 text-base">
              <Link to="/register">
                Đăng ký — miễn phí
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="h-12 px-7 text-base">
              <Link to="/chinh-sach">Đọc chính sách</Link>
            </Button>
          </div>
        </section>

        {/* ===== How it works — horizontal flow ===== */}
        <section className="mt-24">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Cách hoạt động</h2>
          <div className="mt-8 grid gap-0 border-t border-border/60 sm:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="border-b border-border/60 py-6 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-6 sm:first:pl-0"
              >
                <span className="font-display text-3xl font-bold text-primary/20">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-base font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Key points — editorial, no icon circles ===== */}
        <section className="mt-24">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Thu nhập thật, minh bạch
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Mỗi đơn hàng đều có trạng thái rõ ràng: chờ duyệt, đã duyệt, đã thanh toán. Bạn xem
                được lượt click, đơn hàng và hoa hồng ngay trên điện thoại — không số ẩn.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                60 ngày ghi nhận
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Khách click link hôm nay, 59 ngày sau mới mua — vẫn tính hoa hồng cho bạn. Thanh
                toán chuyển khoản từ ngày 1 đến ngày 5 hàng tháng.
              </p>
            </div>
          </div>
        </section>

        {/* ===== Products ===== */}
        <section className="mt-24">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Sản phẩm bạn sẽ giới thiệu
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            4 dòng sơn Lotus — mỗi dòng phục vụ một nhu cầu cụ thể.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {landingPages.length > 0
              ? landingPages.map((p) => {
                  const thumbnail = p.thumbnail_url;
                  const previewUrl = p.base_url ?? "";
                  return (
                    <div
                      key={p.id}
                      className="group overflow-hidden rounded-xl border border-border/50 bg-card"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={p.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/8 to-primary/3">
                            <span className="text-3xl font-display font-bold text-primary/20">
                              {p.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-display text-base font-semibold leading-snug">
                          {p.name}
                        </h3>
                        {p.description ? (
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            {p.description}
                          </p>
                        ) : null}
                        {previewUrl ? (
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            Xem trang sản phẩm
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              : PRODUCTS_FALLBACK.map((p) => (
                  <div key={p.name} className="rounded-xl border border-border/50 bg-card p-5">
                    <h3 className="font-display text-base font-semibold leading-snug">{p.name}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                  </div>
                ))}
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="mt-24">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Câu hỏi thường gặp</h2>
          <div className="mt-6 divide-y divide-border/50 border-y border-border/50">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        {/* ===== Final CTA — quiet, confident ===== */}
        <section className="mt-24">
          <div className="flex flex-col items-start gap-4 border-l-2 border-primary pl-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Bắt đầu hôm nay
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Đăng ký mất 2 phút. Tạo link đầu tiên ngay sau đó. Chia sẻ và kiếm hoa hồng 10% trên
              mỗi đơn giao thành công.
            </p>
            <Button asChild className="mt-2 h-12 px-7 text-base">
              <Link to="/register">
                Đăng ký cộng tác viên
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="border-t border-border/60 bg-background/40">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 text-sm text-muted-foreground">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="font-medium text-foreground">Công ty TNHH SX TM DV Bích Trang</p>
              <p className="mt-1.5 text-xs">Mã số thuế: 0313351528</p>
              <p className="mt-1.5 flex items-start gap-2 text-xs">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>99/5 XTT 26-1 Ấp 2, Xã Bà Điểm, TP.HCM</span>
              </p>
            </div>
            <div className="space-y-1.5 text-xs">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <a href="tel:0943966662" className="hover:text-foreground">
                  0943 966 662
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <a href="mailto:sales@sonlotus.vn" className="hover:text-foreground">
                  sales@sonlotus.vn
                </a>
              </p>
            </div>
            <div className="text-xs">
              <Link to="/chinh-sach" className="hover:text-foreground">
                Chính sách cộng tác viên →
              </Link>
            </div>
          </div>
          <p className="mt-8 border-t border-border/30 pt-4 text-xs">
            © {new Date().getFullYear()} Bích Trang — Sơn Lotus.
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Collapsible FAQ item — minimal, no card border. */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-medium text-sm md:text-base">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? <div className="pb-5 text-sm leading-relaxed text-muted-foreground">{a}</div> : null}
    </div>
  );
}
