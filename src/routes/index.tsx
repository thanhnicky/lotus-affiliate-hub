import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronDown,
  Check,
  Hammer,
  Package,
  Megaphone,
  Link2,
  Share2,
  Headphones,
  Wallet,
  BarChart3,
  Clock,
  ShieldCheck,
  Image,
  Lightbulb,
  Trophy,
  Crown,
  Medal,
} from "lucide-react";
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
          "Có khách cần sơn? Giới thiệu Lotus, nhận 10% hoa hồng mỗi đơn giao thành công. Đăng ký miễn phí, không cần nhập hàng, không cần tự chốt đơn.",
      },
      { property: "og:title", content: "Cộng tác viên sơn Lotus — Hoa hồng 10%" },
      {
        property: "og:description",
        content:
          "Bạn chỉ cần kết nối đúng khách. Lotus tư vấn, báo giá, giao hàng. 10% hoa hồng mỗi đơn giao thành công. Đăng ký miễn phí.",
      },
    ],
  }),
  component: Home,
});

// ─── Data ───

const HERO_BENEFITS = [
  "Không cần nhập hàng",
  "Không cần tự chốt đơn",
  "Link riêng theo dõi minh bạch",
];

const COMMISSION_EXAMPLES = [
  { order: "5.000.000đ", commission: "500.000đ" },
  { order: "10.000.000đ", commission: "1.000.000đ" },
  { order: "20.000.000đ", commission: "2.000.000đ" },
];

const TARGET_GROUPS = [
  {
    icon: Hammer,
    title: "Thợ sơn, thợ thi công",
    text: "Có khách cần sơn gỗ, sơn kim loại, sơn giả gỗ.",
  },
  {
    icon: Package,
    title: "Người bán vật liệu, phụ kiện",
    text: "Có khách cần sơn thêm khi mua vật liệu.",
  },
  {
    icon: Megaphone,
    title: "Creator/KOC về nhà cửa",
    text: "Có tệp người quan tâm nội thất, sửa nhà.",
  },
  {
    icon: BarChart3,
    title: "Cá nhân/fanpage có traffic lớn",
    text: "Đã có kinh nghiệm làm affiliate, muốn thêm dòng sơn.",
  },
];

const FLOW_STEPS = [
  { num: "1", title: "Tạo link riêng", text: "Chọn nhóm sản phẩm, nhận link gắn mã của bạn." },
  {
    num: "2",
    title: "Chia sẻ cho khách",
    text: "Gửi link qua Zalo, Facebook, Reels — cho ai cần sơn.",
  },
  {
    num: "3",
    title: "Lotus lo phần còn lại",
    text: "Tư vấn kỹ thuật, báo giá, giao hàng cho khách.",
  },
  { num: "4", title: "Bạn nhận 10%", text: "Đơn giao thành công → 10% hoa hồng cho bạn." },
];

const STARTER_KIT = [
  {
    icon: Link2,
    title: "Link giới thiệu riêng",
    text: "Tạo link cho từng nhóm sản phẩm, theo kênh chia sẻ.",
  },
  {
    icon: BarChart3,
    title: "Dashboard theo dõi",
    text: "Xem click, đơn hàng, trạng thái và hoa hồng.",
  },
  {
    icon: Image,
    title: "Hình ảnh và video sản phẩm",
    text: "Được Lotus cung cấp khi bắt đầu cộng tác.",
  },
  {
    icon: Lightbulb,
    title: "Gợi ý cách giới thiệu",
    text: "Hướng dẫn giới thiệu sản phẩm cho khách đúng nhu cầu.",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ tư vấn và chốt đơn",
    text: "Đội ngũ Lotus hỗ trợ khách khi cần tư vấn chuyên sâu.",
  },
];

const TRANSPARENCY = [
  "Link riêng theo từng CTV, gắn mã định danh duy nhất",
  "Theo dõi lượt click, đơn hàng, trạng thái xử lý và hoa hồng",
  "Đơn giao thành công được ghi nhận để tính hoa hồng",
  "Lịch thanh toán cố định: từ ngày 1 đến ngày 5 hằng tháng",
  "Cookie ghi nhận giới thiệu trong 60 ngày",
];

const FAQS = [
  {
    q: "Tôi không rành về kỹ thuật sơn, có làm CTV được không?",
    a: "Có. Bạn chỉ cần giới thiệu khách có nhu cầu. Lotus sẽ hỗ trợ tư vấn kỹ thuật, đề xuất hệ sơn, báo giá và xử lý đơn hàng.",
  },
  {
    q: "Tôi có cần nhập hàng hoặc bỏ vốn không?",
    a: "Không. Bạn không cần nhập hàng, giữ tồn kho hay tự giao hàng.",
  },
  {
    q: "Khi nào tôi nhận được hoa hồng?",
    a: "Hoa hồng được tính khi đơn hàng giao thành công và được thanh toán qua chuyển khoản từ ngày 1 đến ngày 5 hằng tháng.",
  },
  {
    q: "Nếu khách chưa mua ngay thì sao?",
    a: "Link giới thiệu được ghi nhận trong 60 ngày. Trong thời hạn này, nếu khách phát sinh đơn hợp lệ từ link của bạn, hệ thống sẽ ghi nhận theo quy định chương trình.",
  },
  {
    q: "Tôi theo dõi đơn hàng và hoa hồng ở đâu?",
    a: "Trong tài khoản CTV, bạn có thể theo dõi link, lượt click, đơn hàng, trạng thái xử lý và hoa hồng.",
  },
  {
    q: "Tôi có thể giới thiệu những sản phẩm nào?",
    a: "Bạn có thể tạo link cho các nhóm sơn giả gỗ trên tấm xi măng, sơn giả gỗ trên kim loại, sơn kim loại gốc nước và sơn gỗ nội–ngoại thất.",
  },
  {
    q: "Đơn hủy hoặc hoàn có được tính hoa hồng không?",
    a: "Hoa hồng chỉ được tính trên đơn giao thành công theo quy định chương trình.",
  },
];

const PRODUCTS_FALLBACK = [
  { name: "Sơn giả gỗ tấm xi măng", desc: "Hiệu ứng gỗ tự nhiên trên tấm xi măng" },
  { name: "Sơn giả gỗ trên kim loại", desc: "Tạo vân gỗ trên cửa sắt, nhôm, cơ khí" },
  { name: "Sơn kim loại gốc nước", desc: "Không mùi, bảo vệ kim loại, dễ thi công" },
  { name: "Sơn gỗ nội–ngoại thất", desc: "Bền màu, chống va đập, lau chùi dễ" },
];

// ─── Component ───

function Home() {
  const pagesQuery = useQuery({
    queryKey: ["landing-pages"],
    queryFn: () => linksService.listLandingPages(),
  });
  const landingPages = pagesQuery.data ?? [];

  const topCtvQuery = useQuery({
    queryKey: ["top-ctv"],
    queryFn: () => linksService.listTopCtv(),
  });
  const topCtv = topCtvQuery.data ?? [];

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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 md:pb-24">
        {/* ===== Hero ===== */}
        <section className="pt-10 md:pt-20">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Chương trình cộng tác viên Sơn Lotus
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-[1.15] tracking-tight md:text-5xl">
            Có khách cần sơn? Giới thiệu Lotus, nhận 10% hoa hồng.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Bạn chỉ cần kết nối đúng khách hàng. Lotus tư vấn kỹ thuật, báo giá và giao hàng. Mỗi
            đơn giao thành công từ link của bạn, bạn nhận 10% hoa hồng.
          </p>

          {/* Benefit chips */}
          <div className="mt-6 flex flex-wrap gap-2">
            {HERO_BENEFITS.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-sm text-foreground"
              >
                <Check className="h-4 w-4 text-primary" />
                {b}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 px-7 text-base">
              <Link to="/register">
                Đăng ký CTV miễn phí
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-7 text-base">
              <Link to="/chinh-sach">Xem cách nhận hoa hồng</Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Xác nhận email xong, tạo link giới thiệu ngay.
          </p>
        </section>

        {/* ===== Commission examples ===== */}
        <section className="mt-16 md:mt-24">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            10% là bao nhiêu tiền cho mỗi đơn?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ví dụ minh họa theo giá trị đơn giao thành công.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {COMMISSION_EXAMPLES.map((ex) => (
              <div key={ex.order} className="rounded-2xl border border-border/50 bg-card p-6">
                <p className="text-sm text-muted-foreground">Đơn {ex.order}</p>
                <p className="mt-2 font-display text-2xl font-semibold text-primary">
                  {ex.commission}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">hoa hồng của bạn</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Ví dụ minh họa. Hoa hồng thực tế được tính theo giá trị đơn hàng giao thành công.
          </p>

          {/* Contextual CTA */}
          <div className="mt-6">
            <Button asChild variant="ghost" className="h-10 px-5 text-sm font-medium">
              <Link to="/register">
                Tạo link và bắt đầu giới thiệu
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* ===== TOP CTV (only if data exists) ===== */}
        {topCtv.length >= 1 ? (
          <section className="mt-16 md:mt-24">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl font-semibold tracking-tight">CTV xuất sắc</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Những cộng tác viên đang kiếm hoa hồng thật từ sơn Lotus — 30 ngày gần nhất.
            </p>
            <div className="mt-6 overflow-hidden rounded-2xl border border-border/50 bg-card">
              {/* Desktop table */}
              <table className="hidden w-full text-sm sm:table">
                <thead>
                  <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Tên</th>
                    <th className="px-4 py-3 font-medium">Mã CTV</th>
                    <th className="px-4 py-3 text-right font-medium">Doanh thu</th>
                    <th className="px-4 py-3 text-right font-medium">Số đơn hàng</th>
                  </tr>
                </thead>
                <tbody>
                  {topCtv.map((ctv, i) => (
                    <tr key={ctv.id} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-3">
                        <RankBadge rank={i + 1} />
                      </td>
                      <td className="px-4 py-3 font-medium">{ctv.display_name}</td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {ctv.affiliate_code || "—"}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">
                        {ctv.revenue_label || "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {ctv.orders_label || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Mobile list */}
              <ul className="divide-y divide-border/30 sm:hidden">
                {topCtv.map((ctv, i) => (
                  <li key={ctv.id} className="flex items-center gap-3 p-4">
                    <RankBadge rank={i + 1} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{ctv.display_name}</p>
                      <code className="text-xs text-muted-foreground">
                        {ctv.affiliate_code || "—"}
                      </code>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{ctv.revenue_label || "—"}</p>
                      <p className="text-xs text-muted-foreground">{ctv.orders_label || "—"}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* ===== Target groups ===== */}
        <section className="mt-16 md:mt-24">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Ai phù hợp để làm CTV Lotus?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Bạn thuộc một trong các nhóm dưới đây? Đây là cơ hội dành cho bạn.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {TARGET_GROUPS.map((g) => (
              <div
                key={g.title}
                className="flex items-start gap-4 rounded-2xl border border-border/50 bg-card p-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <g.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-semibold">{g.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{g.text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Chỉ cần bạn có khách phù hợp hoặc có kênh để giới thiệu đúng người cần sơn, bạn có thể
            bắt đầu.
          </p>
        </section>

        {/* ===== Flow: Bạn giới thiệu, Lotus lo phần còn lại ===== */}
        <section className="mt-16 md:mt-24">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Bạn giới thiệu khách. Lotus lo phần còn lại.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Bạn không cần ôm hàng, không phải giao hàng và không cần xử lý các câu hỏi kỹ thuật phức
            tạp. Đội ngũ Lotus sẽ hỗ trợ khách từ lúc cần tư vấn đến khi hoàn tất đơn.
          </p>
          <div className="mt-8 grid gap-0 border-t border-border/60 sm:grid-cols-4">
            {FLOW_STEPS.map((step) => (
              <div
                key={step.num}
                className="border-b border-border/60 py-6 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-6 sm:first:pl-0"
              >
                <span className="font-display text-3xl font-bold text-primary/20">{step.num}</span>
                <h3 className="mt-2 font-display text-base font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>

          {/* Contextual CTA */}
          <div className="mt-6">
            <Button asChild variant="ghost" className="h-10 px-5 text-sm font-medium">
              <Link to="/register">
                Đăng ký để nhận bộ công cụ CTV
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* ===== Starter kit ===== */}
        <section className="mt-16 md:mt-24">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Đăng ký xong, bạn có gì để bắt đầu?
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STARTER_KIT.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border/50 bg-card p-5">
                <item.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-display text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Transparency ===== */}
        <section className="mt-16 md:mt-24">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Mọi thứ đều có thể theo dõi
          </h2>
          <div className="mt-6 rounded-2xl border border-border/50 bg-card p-6">
            <ul className="space-y-4">
              {TRANSPARENCY.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm leading-relaxed text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Key numbers highlight */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <KeyNumber value="10%" label="hoa hồng / đơn giao thành công" />
            <KeyNumber value="60 ngày" label="ghi nhận giới thiệu" />
            <KeyNumber value="1–5" label="thanh toán hằng tháng" />
          </div>
        </section>

        {/* ===== Products ===== */}
        <section className="mt-16 md:mt-24">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Sản phẩm bạn sẽ giới thiệu
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            4 nhóm sơn Lotus — mỗi nhóm phục vụ một nhu cầu cụ thể.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5">
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
                            <span className="text-2xl font-display font-bold text-primary/20 sm:text-3xl">
                              {p.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-5">
                        <h3 className="font-display text-xs font-semibold leading-snug sm:text-base">
                          {p.name}
                        </h3>
                        {p.description ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                            {p.description}
                          </p>
                        ) : null}
                        {previewUrl ? (
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline sm:mt-3 sm:text-sm"
                          >
                            Xem trang sản phẩm
                            <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              : PRODUCTS_FALLBACK.map((p) => (
                  <div
                    key={p.name}
                    className="rounded-xl border border-border/50 bg-card p-3 sm:p-5"
                  >
                    <h3 className="font-display text-xs font-semibold leading-snug sm:text-base">
                      {p.name}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {p.desc}
                    </p>
                  </div>
                ))}
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="mt-16 md:mt-24">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Câu hỏi thường gặp</h2>
          <div className="mt-6 divide-y divide-border/50 border-y border-border/50">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>

          {/* CTA near FAQ */}
          <div className="mt-8">
            <Button asChild className="h-12 px-7 text-base">
              <Link to="/register">
                Bắt đầu miễn phí
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

      {/* ===== Sticky CTA (mobile only) ===== */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 p-3 backdrop-blur md:hidden">
        <Button asChild className="h-11 w-full text-base">
          <Link to="/register">
            Đăng ký CTV miễn phí
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Sub-components ───

/** Collapsible FAQ item */
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

/** Key number highlight card */
function KeyNumber({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-brand px-3 py-4 text-center text-primary-foreground">
      <p className="font-display text-xl font-bold md:text-2xl">{value}</p>
      <p className="mt-1 text-[11px] leading-tight opacity-80">{label}</p>
    </div>
  );
}

/** Rank badge for TOP CTV table */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Crown className="h-4 w-4" />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-600">
        <Medal className="h-4 w-4" />
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-700">
        <Medal className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
      {rank}
    </span>
  );
}
