import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Phone, Mail, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LotusMark } from "@/components/LotusMark";

export const Route = createFileRoute("/chinh-sach")({
  head: () => ({
    meta: [
      { title: "Chính sách cộng tác viên | Lotus Affiliate" },
      {
        name: "description",
        content:
          "Chính sách và điều khoản chương trình cộng tác viên sơn Lotus: hoa hồng, thanh toán, quyền và nghĩa vụ.",
      },
    ],
  }),
  component: PolicyPage,
});

function PolicyPage() {
  return (
    <div className="min-h-screen bg-soft">
      <header className="mx-auto flex h-16 max-w-4xl items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <LotusMark className="h-9 w-auto" />
        </Link>
        <Button asChild variant="ghost" size="sm" className="ml-auto">
          <Link to="/login">Đăng nhập</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>

        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
          Chính sách cộng tác viên
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chương trình tiếp thị liên kết sơn Lotus (Lotus Affiliate)
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
          <Section title="1. Điều kiện tham gia">
            <ul className="list-disc space-y-1 pl-5">
              <li>Đủ 18 tuổi, có CCCD/CMND hợp lệ.</li>
              <li>Đăng ký tài khoản tại aff.sonlotus.vn và xác nhận email.</li>
              <li>
                Không sử dụng tài khoản để gian lận, spam hoặc gây thiệt hại cho thương hiệu Lotus.
              </li>
            </ul>
          </Section>

          <Section title="2. Hoa hồng">
            <ul className="list-disc space-y-1 pl-5">
              <li>Mức hoa hồng áp dụng theo từng dòng sản phẩm, hiển thị khi bạn tạo link.</li>
              <li>
                Hoa hồng được ghi nhận khi khách đặt hàng qua link của bạn và đơn hàng giao thành
                công.
              </li>
              <li>
                Đơn hàng bị huỷ, hoàn trả hoặc giao không thành công sẽ không được tính hoa hồng. Lý
                do huỷ được ghi rõ trong hệ thống để bạn nắm rõ nguyên nhân.
              </li>
              <li>Lotus kiểm duyệt và duyệt hoa hồng trước khi thanh toán.</li>
            </ul>
          </Section>

          <Section title="3. Thời gian ghi nhận (cookie)">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Khi khách click vào link của bạn, hệ thống ghi nhận mã CTV trên trình duyệt của
                khách trong <strong>60 ngày</strong>.
              </li>
              <li>
                Nếu khách đặt hàng bất cứ lúc nào trong 60 ngày đó (kể cả khi khách rời trang rồi
                quay lại sau), đơn hàng vẫn được gắn với mã CTV của bạn.
              </li>
              <li>
                Sau 60 ngày hoặc khi khách xoá dữ liệu trình duyệt, attribution sẽ mất và đơn hàng
                không còn gắn với CTV.
              </li>
              <li>
                Trong 30 phút sau lần click đầu tiên, các lần click lại cùng link không tính thêm
                lượt (tránh spam).
              </li>
            </ul>
          </Section>

          <Section title="4. Thanh toán">
            <ul className="list-disc space-y-1 pl-5">
              <li>Công ty thanh toán tiền hoa hồng từ ngày 1 đến ngày 5 hàng tháng.</li>
              <li>Số dư có thể rút được hiển thị tại mục "Hoa hồng & Thanh toán".</li>
              <li>Lịch sử các khoản công ty đã chuyển hiển thị minh bạch trong cùng mục.</li>
              <li>
                Mỗi đơn hàng đều có trạng thái rõ ràng:{" "}
                <em>Chờ duyệt → Đã duyệt → Đã thanh toán</em> hoặc <em>Đã huỷ</em> (kèm lý do).
              </li>
            </ul>
          </Section>

          <Section title="5. Quyền và nghĩa vụ của CTV">
            <ul className="list-disc space-y-1 pl-5">
              <li>Được tạo link tiếp thị cho 4 dòng sản phẩm sơn Lotus.</li>
              <li>Được theo dõi lượt click, đơn hàng và hoa hồng theo thời gian thực.</li>
              <li>
                Chia sẻ link trên các kênh cá nhân (Facebook, Zalo, TikTok...). Không chạy quảng cáo
                trả phí trái quy định của Lotus.
              </li>
              <li>Không tự ý giảm giá, cam kết khuyến mãi ngoài chính sách của Lotus.</li>
              <li>Không tuyên truyền sai sự thật về sản phẩm.</li>
            </ul>
          </Section>

          <Section title="6. Bảo mật dữ liệu">
            <ul className="list-disc space-y-1 pl-5">
              <li>CTV chỉ xem được dữ liệu của chính mình (đơn hàng, hoa hồng, link).</li>
              <li>Thông tin khách hàng được ẩn bớt (SĐT, địa chỉ) để bảo vệ quyền riêng tư.</li>
              <li>Tài khoản cá nhân được bảo vệ bằng mật khẩu và xác thực email.</li>
            </ul>
          </Section>

          <Section title="7. Tạm ngưng và chấm dứt">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Lotus có quyền tạm khoá hoặc chấm dứt tài khoản CTV nếu phát hiện vi phạm chính
                sách.
              </li>
              <li>
                CTV có thể ngừng tham gia bất cứ lúc nào bằng cách không còn sử dụng link tiếp thị.
              </li>
            </ul>
          </Section>

          <Section title="8. Liên hệ">
            <p>CTV có thắc mắc về hoa hồng, đơn hàng hoặc chính sách, vui lòng liên hệ:</p>
            <ul className="mt-2 space-y-1 pl-5">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> 0943 966 662
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> sales@sonlotus.vn
              </li>
            </ul>
          </Section>
        </div>
      </main>

      <footer className="border-t border-border/70 bg-background/60">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 text-sm text-muted-foreground">
          <div className="space-y-1">
            <p className="font-medium text-foreground">Công ty TNHH SX TM DV Bích Trang</p>
            <p>Mã số thuế: 0313351528</p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>99/5 XTT 26-1 Ấp 2, Xã Bà Điểm, TP.HCM</span>
            </p>
          </div>
          <p className="mt-6 border-t border-border/40 pt-4 text-xs">
            © {new Date().getFullYear()} Bích Trang — Sơn Lotus.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-3 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}
