import { createFileRoute } from "@tanstack/react-router";

import { RegisterPage } from "@/pages/RegisterPage";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Đăng ký cộng tác viên | Lotus Affiliate Portal" },
      {
        name: "description",
        content:
          "Đăng ký làm cộng tác viên bán sơn Lotus: nhận link tiếp thị riêng và hoa hồng minh bạch.",
      },
      { property: "og:title", content: "Đăng ký cộng tác viên | Lotus Affiliate Portal" },
      { property: "og:description", content: "Trở thành cộng tác viên bán sơn Lotus." },
    ],
  }),
  component: RegisterPage,
});
