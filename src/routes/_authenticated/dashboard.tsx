import { createFileRoute } from "@tanstack/react-router";

import { RequireActive } from "@/components/RequireActive";
import { DashboardPage } from "@/pages/DashboardPage";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Tổng quan | Lotus Affiliate Portal" },
      {
        name: "description",
        content: "Theo dõi lượt click, lead, đơn hàng và hoa hồng bán sơn Lotus của bạn.",
      },
      { property: "og:title", content: "Tổng quan | Lotus Affiliate Portal" },
      { property: "og:description", content: "Hiệu quả tiếp thị sơn Lotus của cộng tác viên." },
    ],
  }),
  component: () => (
    <RequireActive>
      <DashboardPage />
    </RequireActive>
  ),
});
