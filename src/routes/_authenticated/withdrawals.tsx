import { createFileRoute } from "@tanstack/react-router";

import { RequireActive } from "@/components/RequireActive";
import { WithdrawalsPage } from "@/pages/WithdrawalsPage";

export const Route = createFileRoute("/_authenticated/withdrawals")({
  head: () => ({
    meta: [
      { title: "Rút tiền hoa hồng | Lotus Affiliate Portal" },
      {
        name: "description",
        content: "Xem số dư hoa hồng, gửi yêu cầu rút tiền và theo dõi lịch sử thanh toán.",
      },
      { property: "og:title", content: "Rút tiền hoa hồng | Lotus Affiliate Portal" },
      { property: "og:description", content: "Quản lý yêu cầu rút hoa hồng cộng tác viên Lotus." },
    ],
  }),
  component: () => (
    <RequireActive>
      <WithdrawalsPage />
    </RequireActive>
  ),
});
