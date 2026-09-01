import { createFileRoute } from "@tanstack/react-router";

import { AdminTopCtvPage } from "@/pages/AdminTopCtvPage";
import { RequireAdmin } from "@/components/RequireAdmin";

export const Route = createFileRoute("/_authenticated/admin-top-ctv")({
  head: () => ({
    meta: [{ title: "TOP CTV | Lotus Affiliate Portal" }],
  }),
  component: () => (
    <RequireAdmin>
      <AdminTopCtvPage />
    </RequireAdmin>
  ),
});
