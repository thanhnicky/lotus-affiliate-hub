import type { ShareChannel, WithdrawalStatus, AffiliateStatus } from "@/types";

export const SHARE_CHANNELS: { value: ShareChannel; label: string }[] = [
  { value: "zalo_personal", label: "Zalo cá nhân" },
  { value: "zalo_group", label: "Zalo nhóm" },
  { value: "facebook_personal", label: "Facebook cá nhân" },
  { value: "facebook_group", label: "Facebook Group" },
  { value: "facebook_page", label: "Facebook Page" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website/Blog" },
  { value: "email", label: "Email" },
  { value: "referral", label: "Khách giới thiệu" },
  { value: "offline_qr", label: "QR code/Offline" },
  { value: "other", label: "Khác" },
];

export const CHANNEL_LABEL: Record<ShareChannel, string> = SHARE_CHANNELS.reduce(
  (acc, c) => ({ ...acc, [c.value]: c.label }),
  {} as Record<ShareChannel, string>,
);

export const WITHDRAWAL_STATUS_LABEL: Record<WithdrawalStatus, string> = {
  requested: "Chờ duyệt",
  approved: "Đã duyệt",
  paid: "Đã chuyển khoản",
  rejected: "Từ chối",
};

export const AFFILIATE_STATUS_LABEL: Record<AffiliateStatus, string> = {
  pending: "Chờ duyệt",
  active: "Đang hoạt động",
  suspended: "Tạm khoá",
};

export const SUPPORT_ZALO = "0901234567";
export const SUPPORT_ZALO_URL = "https://zalo.me/0901234567";
