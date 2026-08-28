/**
 * Kiểu dữ liệu dùng chung cho Lotus Affiliate Portal.
 * Các interface này được thiết kế khớp với schema Supabase dự kiến
 * để sau này chỉ cần thay lớp service mock bằng service gọi Supabase thật.
 */

export type AffiliateStatus = "pending" | "active" | "suspended";
export type AffiliateRole = "affiliate" | "admin";

/** Bảng dự kiến: public.profiles */
export interface AffiliateProfile {
  id: string;
  affiliate_code: string;
  full_name: string;
  phone: string;
  zalo: string;
  email: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  commission_rate: number;
  status: AffiliateStatus;
  role: AffiliateRole;
  created_at: string;
}

/** Trường CTV được phép tự chỉnh sửa */
export type EditableProfileFields = Pick<
  AffiliateProfile,
  "full_name" | "phone" | "zalo" | "bank_name" | "bank_account_number" | "bank_account_name"
>;

/** Bảng dự kiến: public.landing_pages */
export interface LandingPage {
  id: string;
  name: string;
  slug: string;
  product_line: string;
  base_url: string;
}

export type ShareChannel =
  | "zalo_personal"
  | "zalo_group"
  | "facebook_personal"
  | "facebook_group"
  | "facebook_page"
  | "tiktok"
  | "youtube"
  | "website"
  | "email"
  | "referral"
  | "offline_qr"
  | "other";

/** Bảng dự kiến: public.affiliate_links */
export interface AffiliateLink {
  id: string;
  affiliate_id: string;
  landing_page_id: string;
  landing_page_name: string;
  channel: ShareChannel;
  campaign: string | null;
  full_url: string;
  clicks: number;
  leads: number;
  orders: number;
  revenue: number;
  commission: number;
  created_at: string;
}

export interface CreateLinkInput {
  landing_page_id: string;
  channel: ShareChannel;
  campaign?: string;
}

export interface DashboardStats {
  clicks: number;
  leads: number;
  orders: number;
  pending_commission: number;
  available_commission: number;
}

export type WithdrawalStatus = "requested" | "approved" | "paid" | "rejected";

/** Bảng dự kiến: public.withdrawals */
export interface Withdrawal {
  id: string;
  affiliate_id: string;
  amount: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  note: string | null;
  status: WithdrawalStatus;
  created_at: string;
}

export interface WithdrawalInput {
  amount: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  note?: string;
}

export interface SignUpInput {
  full_name: string;
  phone: string;
  zalo: string;
  email: string;
  password: string;
}

export interface AuthSession {
  user_id: string;
  email: string;
}

export class ServiceError extends Error {}
