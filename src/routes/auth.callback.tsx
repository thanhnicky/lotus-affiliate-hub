import { createFileRoute } from "@tanstack/react-router";

import { AuthCallbackPage } from "@/pages/AuthCallbackPage";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Xác thực tài khoản | Lotus Affiliate Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthCallbackPage,
});
