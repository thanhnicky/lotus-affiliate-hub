import { createFileRoute } from "@tanstack/react-router";

import { RequireAdmin } from "@/components/RequireAdmin";
import { AdminOrdersPage } from "@/pages/AdminOrdersPage";

export const Route = createFileRoute("/_authenticated/admin-orders")({
  head: () => ({
    meta: [
      { title: "Quản lý đơn hàng | Lotus Affiliate Portal" },
      {
        name: "description",
        content: "Nhập đơn hàng thủ công và duyệt hoa hồng cho cộng tác viên.",
      },
    ],
  }),
  component: () => (
    <RequireAdmin>
      <AdminOrdersPage />
    </RequireAdmin>
  ),
});
