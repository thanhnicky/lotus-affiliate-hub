import { createFileRoute } from "@tanstack/react-router";

import { PendingPage } from "@/pages/PendingPage";

export const Route = createFileRoute("/_authenticated/pending")({
  head: () => ({
    meta: [
      { title: "Tài khoản chờ duyệt | Lotus Affiliate Portal" },
      {
        name: "description",
        content: "Hồ sơ cộng tác viên sơn Lotus của bạn đang được xét duyệt.",
      },
      { property: "og:title", content: "Tài khoản chờ duyệt | Lotus Affiliate Portal" },
      { property: "og:description", content: "Trạng thái duyệt hồ sơ cộng tác viên sơn Lotus." },
    ],
  }),
  component: PendingPage,
});
