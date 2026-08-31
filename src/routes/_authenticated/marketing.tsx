import { createFileRoute } from "@tanstack/react-router";

import { MarketingMaterialsPage } from "@/pages/MarketingMaterialsPage";

export const Route = createFileRoute("/_authenticated/marketing")({
  head: () => ({
    meta: [
      { title: "Tài liệu marketing | Lotus Affiliate Portal" },
      {
        name: "description",
        content: "Tải ảnh, video và prompt AI để tạo content bán hàng riêng.",
      },
    ],
  }),
  component: MarketingMaterialsPage,
});
