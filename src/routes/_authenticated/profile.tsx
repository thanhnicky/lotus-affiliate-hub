import { createFileRoute } from "@tanstack/react-router";

import { ProfilePage } from "@/pages/ProfilePage";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Hồ sơ cộng tác viên | Lotus Affiliate Portal" },
      {
        name: "description",
        content: "Cập nhật họ tên, số điện thoại, Zalo và tài khoản ngân hàng nhận hoa hồng.",
      },
      { property: "og:title", content: "Hồ sơ cộng tác viên | Lotus Affiliate Portal" },
      { property: "og:description", content: "Thông tin cộng tác viên sơn Lotus." },
    ],
  }),
  component: ProfilePage,
});
