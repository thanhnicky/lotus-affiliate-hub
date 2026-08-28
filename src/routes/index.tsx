import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgePercent, Share2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LotusMark } from "@/components/LotusMark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cổng cộng tác viên sơn Lotus" },
      {
        name: "description",
        content:
          "Cổng cộng tác viên sơn Lotus: đăng ký, tạo link tiếp thị riêng cho 4 dòng sản phẩm và theo dõi hiệu quả bán hàng.",
      },
      { property: "og:title", content: "Cổng cộng tác viên sơn Lotus" },
      {
        property: "og:description",
        content: "Đăng ký làm cộng tác viên sơn Lotus và tạo link tiếp thị chỉ trong vài phút.",
      },
    ],
  }),
  component: Home,
});

const FEATURES = [
  {
    icon: Share2,
    title: "Link riêng cho từng kênh",
    text: "Chọn sản phẩm, chọn kênh Facebook / Zalo / TikTok và nhận link gắn sẵn mã của bạn.",
  },
  {
    icon: BadgePercent,
    title: "Ghi nhận doanh số minh bạch",
    text: "Mỗi lượt click và đơn hàng đều gắn với mã cộng tác viên của riêng bạn.",
  },
  {
    icon: ShieldCheck,
    title: "Dữ liệu được bảo vệ",
    text: "Bạn chỉ nhìn thấy dữ liệu của chính mình, an toàn tuyệt đối.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-soft">
      <header className="mx-auto flex h-16 max-w-6xl items-center px-4">
        <div className="flex items-center gap-2">
          <LotusMark className="h-8 w-8" />
          <span className="font-display text-lg font-semibold tracking-tight">Lotus CTV</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/login">Đăng nhập</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Đăng ký</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 md:pt-20">
        <section className="max-w-2xl">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            Chương trình cộng tác viên
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Bán sơn Lotus, tạo thu nhập từ chính mạng lưới của bạn
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Đăng ký cộng tác viên, nhận link tiếp thị riêng cho 4 dòng sản phẩm sơn Lotus và theo
            dõi hiệu quả ngay trên điện thoại.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 px-7 text-base">
              <Link to="/register">
                Đăng ký cộng tác viên
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-7 text-base">
              <Link to="/login">Tôi đã có tài khoản</Link>
            </Button>
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-border/70 bg-card p-6 shadow-card"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
