import { createFileRoute } from "@tanstack/react-router";

import { RequireAdmin } from "@/components/RequireAdmin";
import { AdminAffiliatesPage } from "@/pages/AdminAffiliatesPage";

export const Route = createFileRoute("/_authenticated/admin-affiliates")({
  head: () => ({
    meta: [
      { title: "Quản lý cộng tác viên | Lotus Affiliate Portal" },
      {
        name: "description",
        content: "Danh sách cộng tác viên, thống kê hiệu suất và thông tin thanh toán.",
      },
    ],
  }),
  component: () => (
    <RequireAdmin>
      <AdminAffiliatesPage />
    </RequireAdmin>
  ),
});
