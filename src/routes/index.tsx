import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgePercent,
  Share2,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Wallet,
  Clock,
  TrendingUp,
  CheckCircle2,
  MousePointerClick,
  PackageCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LotusMark } from "@/components/LotusMark";

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
    num: "1",
    icon: Users,
    title: "Đăng ký miễn phí",
    text: "Tạo tài khoản CTV trong 2 phút, xác nhận email là xong. Không phí, không thủ tục phức tạp.",
  },
  {
    num: "2",
    icon: Share2,
    title: "Tạo link & chia sẻ",
    text: "Chọn sản phẩm, chọn kênh (Facebook, Zalo, TikTok...) và nhận link gắn sẵn mã của bạn. Chia sẻ cho ai cần sơn.",
  },
  {
    num: "3",
    icon: MousePointerClick,
    title: "Khách đặt hàng",
    text: "Khi khách click link và đặt hàng, hệ thống tự động ghi nhận mã CTV của bạn. 60 ngày vẫn tính.",
  },
  {
    num: "4",
    icon: Wallet,
    title: "Nhận hoa hồng 10%",
    text: "Đơn giao thành công → hoa hồng 10% được duyệt. Công ty thanh toán từ ngày 1-5 hàng tháng.",
  },
];

const BENEFITS = [
  {
    icon: BadgePercent,
    title: "Hoa hồng 10% mỗi đơn",
    text: "Mỗi đơn hàng sơn Lotus giao thành công, bạn nhận 10% giá trị đơn. Không giới hạn số lượng đơn.",
  },
  {
    icon: Clock,
    title: "Cookie 60 ngày",
    text: "Khách click link hôm nay, 59 ngày sau mới mua → vẫn tính hoa hồng cho bạn. Không lo mất khách.",
  },
  {
    icon: TrendingUp,
    title: "Theo dõi real-time",
    text: "Xem lượt click, đơn hàng, hoa hồng ngay trên điện thoại. Mọi thứ minh bạch, không số ẩn.",
  },
  {
    icon: Wallet,
    title: "Thanh toán hàng tháng",
    text: "Công ty chuyển khoản hoa hồng từ ngày 1-5 hàng tháng. Lịch sử từng khoản hiển thị rõ ràng.",
  },
  {
    icon: ShieldCheck,
    title: "Dữ liệu bảo mật",
    text: "Bạn chỉ thấy dữ liệu của mình. Thông tin khách được ẩn bớt để bảo vệ quyền riêng tư.",
  },
  {
    icon: PackageCheck,
    title: "4 dòng sản phẩm",
    text: "Sơn nội thất, ngoại thất, sơn lót, chống thấm — đa dạng để bạn chọn sản phẩm phù hợp kênh của mình.",
  },
];

const PRODUCTS = [
  { name: "Sơn nội thất Lotus Premium", desc: "Lau chùi dễ dàng, an toàn cho gia đình" },
  { name: "Sơn ngoại thất Weather Shield", desc: "Chống nắng mưa, bền màu 10 năm" },
  { name: "Sơn lót chống kiềm Lotus", desc: "Tăng độ bám dính, ngăn kiềm hoá" },
  { name: "Chống thấm Lotus Max", desc: "Giải pháp chống thấm tường, sân thượng" },
];

function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-soft">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center px-4">
        <Link to="/" className="flex items-center">
          <LotusMark className="h-12 w-auto" />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/login">Đăng nhập</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Đăng ký</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20">
        {/* ===== Hero ===== */}
        <section className="pt-10 md:pt-16">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <BadgePercent className="h-4 w-4" />
                Hoa hồng 10% mỗi đơn hàng
              </span>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                Kiếm thu nhập từ việc giới thiệu sơn Lotus
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Đăng ký làm cộng tác viên, chia sẻ link sản phẩm sơn Lotus với mạng lưới của bạn.
                Mỗi đơn hàng giao thành công — bạn nhận{" "}
                <strong className="text-foreground">10% hoa hồng</strong>. Không cần nhập hàng,
                không cần giao hàng, không rủi ro.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 px-7 text-base">
                  <Link to="/register">
                    Đăng ký ngay — miễn phí
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 px-7 text-base">
                  <Link to="/chinh-sach">Xem chính sách</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Đăng ký mất 2 phút · Không phí · Thanh toán hàng tháng
              </p>
            </div>

            {/* Commission highlight card */}
            <div className="lg:justify-self-end">
              <div className="rounded-3xl bg-brand p-8 text-primary-foreground shadow-lift">
                <p className="text-sm opacity-90">Hoa hồng trên mỗi đơn giao thành công</p>
                <p className="mt-2 font-display text-6xl font-bold tracking-tight">10%</p>
                <div className="mt-6 space-y-3 border-t border-primary-foreground/20 pt-6 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 opacity-80" />
                    <span>Không giới hạn số lượng đơn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 opacity-80" />
                    <span>Cookie 60 ngày — khách mua sau vẫn tính</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 opacity-80" />
                    <span>Thanh toán 1-5 hàng tháng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 opacity-80" />
                    <span>Theo dõi đơn hàng & hoa hồng real-time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== How it works ===== */}
        <section className="mt-20">
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              4 bước đơn giản để bắt đầu kiếm hoa hồng
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              Không cần kinh nghiệm bán hàng. Không cần nhập kho. Chỉ cần chia sẻ link.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="relative rounded-3xl border border-border/70 bg-card p-6 shadow-card"
              >
                <span className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow">
                  {step.num}
                </span>
                <span className="mt-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Benefits ===== */}
        <section className="mt-20">
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Vì sao nên làm CTV sơn Lotus?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              Minh bạch, công bằng và thực sự có thu nhập — không phải lời hứa suông.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-3xl border border-border/70 bg-card p-6 shadow-card"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <b.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Products ===== */}
        <section className="mt-20">
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              4 dòng sản phẩm để bạn chọn
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              Mỗi dòng sản phẩm phục vụ một nhu cầu khác nhau — dễ tìm khách hàng.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-border/70 bg-card p-5 shadow-card"
              >
                <h3 className="font-display text-sm font-semibold leading-snug">{p.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Final CTA ===== */}
        <section className="mt-20">
          <div className="rounded-3xl bg-brand p-8 text-center text-primary-foreground shadow-lift md:p-12">
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Sẵn sàng bắt đầu kiếm thu nhập?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm opacity-90 md:text-base">
              Đăng ký miễn phí hôm nay. Tạo link đầu tiên trong 2 phút. Chia sẻ và bắt đầu kiếm hoa
              hồng 10% trên mỗi đơn giao thành công.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link to="/register">
                  Đăng ký ngay
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-primary-foreground/30 bg-transparent px-8 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/chinh-sach">Đọc chính sách</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-background/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="font-medium text-foreground">Công ty TNHH SX TM DV Bích Trang</p>
              <p className="mt-1">Mã số thuế: 0313351528</p>
            </div>
            <div>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>99/5 XTT 26-1 Ấp 2, Xã Bà Điểm, TP.HCM</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <a href="tel:0943966662" className="hover:text-foreground">
                  0943 966 662
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mailto:sales@sonlotus.vn" className="hover:text-foreground">
                  sales@sonlotus.vn
                </a>
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4 text-xs">
            <span>© {new Date().getFullYear()} Bích Trang — Sơn Lotus.</span>
            <Link to="/chinh-sach" className="hover:text-foreground">
              Chính sách cộng tác viên
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
