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
        <p className="mt-1 text-xs text-muted-foreground">Bản cập nhật — 04/09/2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
          {/* 1. Điều kiện tham gia */}
          <Section title="1. Điều kiện tham gia">
            <ul className="list-disc space-y-1 pl-5">
              <li>Đủ 18 tuổi, có CCCD/CMND hợp lệ.</li>
              <li>Đăng ký tài khoản tại aff.sonlotus.vn và xác nhận email.</li>
              <li>
                Không sử dụng tài khoản để gian lận, spam hoặc gây thiệt hại cho thương hiệu Lotus.
              </li>
            </ul>
          </Section>

          {/* 2. Hoa hồng */}
          <Section title="2. Hoa hồng">
            <h3 className="mt-2 font-display text-base font-semibold">
              2.1 Mức hoa hồng theo giai đoạn
            </h3>
            <p className="mt-1">
              Kể từ ngày đăng ký tài khoản CTV, hoa hồng được áp dụng theo các mốc sau:
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Giai đoạn</th>
                    <th className="py-2 pr-4 font-medium">Thời gian (từ ngày đăng ký)</th>
                    <th className="py-2 pr-4 font-medium">Hệ số</th>
                    <th className="py-2 font-medium text-right">Mức hoa hồng</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium">Khởi động</td>
                    <td className="py-2 pr-4">Ngày 1 – 30</td>
                    <td className="py-2 pr-4">x2</td>
                    <td className="py-2 text-right font-semibold text-primary">20%</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium">Tăng tốc</td>
                    <td className="py-2 pr-4">Ngày 31 – 60</td>
                    <td className="py-2 pr-4">x1.5</td>
                    <td className="py-2 text-right font-semibold text-primary">15%</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Ổn định</td>
                    <td className="py-2 pr-4">Từ ngày 61 trở đi</td>
                    <td className="py-2 pr-4">x1</td>
                    <td className="py-2 text-right font-semibold text-primary">10%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ul className="mt-4 list-disc space-y-1 pl-5">
              <li>
                Hoa hồng áp dụng theo <strong>thời điểm đơn hàng hoàn tất</strong> (không phải thời
                điểm khách click link hoặc đặt hàng). Ví dụ: nếu bạn click link trong giai đoạn 20%
                nhưng đơn hàng chỉ hoàn tất ở ngày 35, đơn đó được tính theo mức hoa hồng của giai
                đoạn tại thời điểm hoàn tất (15%).
              </li>
              <li>Mức hoa hồng cụ thể theo từng dòng sản phẩm hiển thị khi bạn tạo link.</li>
              <li>
                Hoa hồng được ghi nhận khi khách đặt hàng qua link của bạn <strong>và</strong> đơn
                hàng giao thành công.
              </li>
              <li>
                Đơn hàng bị huỷ, hoàn trả hoặc giao không thành công sẽ không được tính hoa hồng. Lý
                do huỷ được ghi rõ trong hệ thống để bạn nắm rõ nguyên nhân.
              </li>
              <li>Lotus kiểm duyệt và duyệt hoa hồng trước khi thanh toán.</li>
            </ul>

            <h3 className="mt-5 font-display text-base font-semibold">
              2.2 Đơn hàng hoàn trả sau khi đã thanh toán hoa hồng
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Nếu khách hoàn trả sản phẩm <strong>sau khi</strong> hoa hồng của đơn đó đã được
                thanh toán cho CTV, giá trị hoa hồng tương ứng sẽ được trừ vào kỳ thanh toán gần
                nhất tiếp theo.
              </li>
              <li>
                Nếu tài khoản CTV không còn hoạt động hoặc số dư kỳ sau không đủ để trừ, Lotus sẽ
                liên hệ trực tiếp để xử lý.
              </li>
            </ul>

            <h3 className="mt-5 font-display text-base font-semibold">2.3 Thuế thu nhập cá nhân</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Theo quy định pháp luật hiện hành, hoa hồng chi trả từ 2.000.000đ/lần trở lên sẽ bị
                khấu trừ 10% thuế thu nhập cá nhân (TNCN) trước khi thanh toán.
              </li>
              <li>
                Số tiền thực nhận sau thuế được hiển thị rõ trong lịch sử thanh toán tại mục "Hoa
                hồng & Thanh toán".
              </li>
            </ul>
          </Section>

          {/* 3. Thời gian ghi nhận */}
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

          {/* 4. Thanh toán */}
          <Section title="4. Thanh toán">
            <ul className="list-disc space-y-1 pl-5">
              <li>Công ty thanh toán tiền hoa hồng từ ngày 1 đến ngày 5 hàng tháng.</li>
              <li>Số dư có thể rút được hiển thị tại mục "Hoa hồng & Thanh toán".</li>
              <li>
                Ngưỡng rút tối thiểu: <strong>200.000đ/lần rút</strong>.
              </li>
              <li>Lịch sử các khoản công ty đã chuyển hiển thị minh bạch trong cùng mục.</li>
              <li>
                Mỗi đơn hàng đều có trạng thái rõ ràng:{" "}
                <em>Chờ duyệt → Đã duyệt → Đã thanh toán</em> hoặc <em>Đã huỷ</em> (kèm lý do).
              </li>
            </ul>
          </Section>

          {/* 5. Quyền và nghĩa vụ */}
          <Section title="5. Quyền và nghĩa vụ của CTV">
            <ul className="list-disc space-y-1 pl-5">
              <li>Được tạo link tiếp thị cho 4 dòng sản phẩm sơn Lotus.</li>
              <li>Được theo dõi lượt click, đơn hàng và hoa hồng theo thời gian thực.</li>
              <li>Chia sẻ link trên các kênh cá nhân (Facebook, Zalo, TikTok...).</li>
            </ul>
            <p className="mt-3 font-medium">Về quảng cáo trả phí:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                CTV được phép tự chạy quảng cáo trả phí (Google Ads, Facebook Ads, TikTok Ads) để
                quảng bá link của mình, chi phí do CTV tự chịu.
              </li>
              <li>
                <strong>Không được</strong> đấu giá (bidding) trực tiếp các từ khoá thương hiệu:
                "Lotus", "sơn Lotus", "sơn giả gỗ Lotus" và các biến thể liên quan trên Google Ads
                hoặc bất kỳ nền tảng tìm kiếm nào.
              </li>
              <li>
                <strong>Không được</strong> tạo trang đích (landing page) hoặc quảng cáo có tên
                miền, tiêu đề gây nhầm lẫn là kênh chính thức của Lotus.
              </li>
            </ul>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Không tự ý giảm giá, cam kết khuyến mãi ngoài chính sách của Lotus.</li>
              <li>Không tuyên truyền sai sự thật về sản phẩm.</li>
            </ul>
          </Section>

          {/* 6. Bảo mật dữ liệu */}
          <Section title="6. Bảo mật dữ liệu">
            <ul className="list-disc space-y-1 pl-5">
              <li>CTV chỉ xem được dữ liệu của chính mình (đơn hàng, hoa hồng, link).</li>
              <li>Thông tin khách hàng được ẩn bớt (SĐT, địa chỉ) để bảo vệ quyền riêng tư.</li>
              <li>Tài khoản cá nhân được bảo vệ bằng mật khẩu và xác thực email.</li>
            </ul>
          </Section>

          {/* 7. Tạm ngưng và chấm dứt */}
          <Section title="7. Tạm ngưng và chấm dứt">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Lotus có quyền tạm khoá hoặc chấm dứt tài khoản CTV nếu phát hiện vi phạm chính
                sách.
              </li>
            </ul>
            <p className="mt-3 font-medium">Hoa hồng đã tích luỹ:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                Hoa hồng ở trạng thái <strong>Đã duyệt</strong> hoặc <strong>Đã thanh toán</strong>{" "}
                trước thời điểm tài khoản bị khoá vẫn được chi trả đầy đủ cho CTV, trừ trường hợp
                khoá do gian lận đơn hàng liên quan trực tiếp đến các đơn hoa hồng đó.
              </li>
              <li>
                Hoa hồng ở trạng thái <strong>Chờ duyệt</strong> tại thời điểm khoá tài khoản sẽ
                được Lotus xem xét từng trường hợp cụ thể.
              </li>
            </ul>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                CTV có thể ngừng tham gia bất cứ lúc nào bằng cách không còn sử dụng link tiếp thị.
              </li>
            </ul>
          </Section>

          {/* 8. Thay đổi chính sách */}
          <Section title="8. Thay đổi chính sách">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Lotus có thể điều chỉnh chính sách hoa hồng, cookie hoặc các điều khoản khác theo
                tình hình kinh doanh.
              </li>
              <li>
                Mọi thay đổi sẽ được thông báo trước <strong>ít nhất 14 ngày</strong> qua email/Zalo
                đã đăng ký, trước khi chính sách mới có hiệu lực.
              </li>
              <li>
                Thay đổi không áp dụng hồi tố cho các đơn hàng đã phát sinh trước ngày chính sách
                mới có hiệu lực.
              </li>
            </ul>
          </Section>

          {/* 9. Khiếu nại và hỗ trợ */}
          <Section title="9. Khiếu nại và hỗ trợ">
            <p>CTV có thắc mắc về hoa hồng, đơn hàng hoặc chính sách, vui lòng liên hệ:</p>
            <ul className="mt-2 space-y-1 pl-5">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> 0943 966 662
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> sales@sonlotus.vn
              </li>
            </ul>
            <p className="mt-3">
              Lotus cam kết phản hồi khiếu nại trong vòng <strong>2-3 ngày làm việc</strong> kể từ
              khi nhận được yêu cầu.
            </p>
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
