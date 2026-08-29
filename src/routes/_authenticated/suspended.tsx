import { createFileRoute } from "@tanstack/react-router";

import { PendingPage } from "@/pages/PendingPage";

export const Route = createFileRoute("/_authenticated/suspended")({
  head: () => ({
    meta: [
      { title: "Tài khoản tạm khoá | Lotus Affiliate Portal" },
      {
        name: "description",
        content: "Tài khoản cộng tác viên Lotus của bạn đang ở trạng thái tạm khóa.",
      },
      { property: "og:title", content: "Tài khoản tạm khoá | Lotus Affiliate Portal" },
      { property: "og:description", content: "Thông báo tài khoản tạm khoá." },
    ],
  }),
  component: PendingPage,
});
