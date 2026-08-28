import { createFileRoute } from "@tanstack/react-router";

import { RequireActive } from "@/components/RequireActive";
import { CreateLinkPage } from "@/pages/CreateLinkPage";

export const Route = createFileRoute("/_authenticated/create-link")({
  head: () => ({
    meta: [
      { title: "Tạo link bán hàng | Lotus Affiliate Portal" },
      {
        name: "description",
        content: "Tạo link tiếp thị sơn Lotus theo landing page, kênh chia sẻ và chiến dịch.",
      },
      { property: "og:title", content: "Tạo link bán hàng | Lotus Affiliate Portal" },
      { property: "og:description", content: "Tạo link tiếp thị và QR code bán sơn Lotus." },
    ],
  }),
  component: () => (
    <RequireActive>
      <CreateLinkPage />
    </RequireActive>
  ),
});
