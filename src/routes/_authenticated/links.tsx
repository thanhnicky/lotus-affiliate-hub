import { createFileRoute } from "@tanstack/react-router";

import { RequireActive } from "@/components/RequireActive";
import { LinksPage } from "@/pages/LinksPage";

export const Route = createFileRoute("/_authenticated/links")({
  head: () => ({
    meta: [
      { title: "Link của tôi | Lotus Affiliate Portal" },
      {
        name: "description",
        content: "Quản lý toàn bộ link tiếp thị sơn Lotus cùng click, lead, đơn và hoa hồng.",
      },
      { property: "og:title", content: "Link của tôi | Lotus Affiliate Portal" },
      { property: "og:description", content: "Danh sách link tiếp thị sơn Lotus của bạn." },
    ],
  }),
  component: () => (
    <RequireActive>
      <LinksPage />
    </RequireActive>
  ),
});
