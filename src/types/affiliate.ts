export type AffiliateStatus = "pending" | "active" | "suspended";

export interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  full_name: string;
  phone: string;
  zalo_id?: string | null;
  email?: string | null;
  bank_name?: string | null;
  bank_account?: string | null;
  bank_holder?: string | null;
  commission_rate?: number;
  total_earnings?: number;
  pending_earnings?: number;
  paid_earnings?: number;
  status: AffiliateStatus;
  role?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  terms_accepted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LandingPage {
  id: string;
  name: string;
  slug?: string;
  product_line?: string;
  base_url?: string;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
}

export interface AffiliateLink {
  id: string;
  affiliate_id: string;
  landing_page_id?: string;
  landing_page_name?: string;
  channel: string;
  campaign_name?: string | null;
  affiliate_url: string;
  clicks?: number;
  conversions?: number;
  total_revenue?: number;
  commission?: number;
  created_at: string;
}

export type WithdrawalStatus = "requested" | "approved" | "paid" | "rejected" | string;

export interface Withdrawal {
  id: string;
  affiliate_id: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  note?: string | null;
  status: WithdrawalStatus;
  created_at: string;
}

export type EditableProfileFields = {
  full_name: string;
  phone: string;
  zalo_id?: string | null | undefined;
  bank_name?: string | null | undefined;
  bank_account?: string | null | undefined;
  bank_holder?: string | null | undefined;
};

export interface CreateLinkInput {
  landing_page_id: string;
  channel: string;
  campaign_name?: string | null | undefined;
}

export interface WithdrawalInput {
  amount: number;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  note?: string | null | undefined;
}

export interface DashboardStats {
  clicks: number;
  leads: number;
  orders: number;
  pending_commission: number;
  available_commission: number;
}

export type OrderStatus = "pending" | "approved" | "rejected";

export interface Order {
  id: string;
  external_reference: string;
  affiliate_id: string | null;
  affiliate_link_id: string | null;
  affiliate_code: string | null;
  order_value: number;
  commission_rate: number | null;
  commission_amount: number;
  customer_name: string | null;
  customer_phone: string | null;
  status: OrderStatus;
  source: string;
  note: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderInput {
  external_reference: string;
  affiliate_code: string;
  order_value: number;
  customer_name?: string | null | undefined;
  customer_phone?: string | null | undefined;
  campaign_slug?: string | null | undefined;
}
