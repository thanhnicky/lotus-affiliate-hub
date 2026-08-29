export * from "./affiliate";

export type AffiliateRole = "affiliate" | "admin";

/** Tương thích với interface cũ nếu còn tham chiếu */
export type AffiliateProfile = import("./affiliate").Affiliate & {
  zalo?: string;
  bank_account_number?: string;
  bank_account_name?: string;
};

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
  | "other"
  | string;

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

