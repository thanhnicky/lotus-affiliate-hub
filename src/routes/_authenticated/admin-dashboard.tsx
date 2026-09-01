import { createFileRoute } from "@tanstack/react-router";

import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { RequireAdmin } from "@/components/RequireAdmin";

export const Route = createFileRoute("/_authenticated/admin-dashboard")({
  head: () => ({
    meta: [{ title: "Tổng quan hệ thống | Lotus Affiliate Portal" }],
  }),
  component: () => (
    <RequireAdmin>
      <AdminDashboardPage />
    </RequireAdmin>
  ),
});
