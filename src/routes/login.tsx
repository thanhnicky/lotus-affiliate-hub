import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "@/pages/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Đăng nhập | Lotus Affiliate Portal" },
      {
        name: "description",
        content:
          "Đăng nhập Lotus Affiliate Portal để tạo link bán sơn Lotus và theo dõi hoa hồng cộng tác viên.",
      },
      { property: "og:title", content: "Đăng nhập | Lotus Affiliate Portal" },
      { property: "og:description", content: "Cổng cộng tác viên bán sơn Lotus." },
    ],
  }),
  component: LoginPage,
});
