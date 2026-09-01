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

/** Admin view of an affiliate, enriched with order stats. */
export interface AdminAffiliate extends Affiliate {
  order_count: number;
  approved_order_count: number;
  pending_commission: number;
  available_commission: number;
  paid_commission: number;
  last_order_at?: string | null;
}

export interface LandingPage {
  id: string;
  name: string;
  slug?: string;
  product_line?: string;
  base_url?: string;
  is_active?: boolean;
  sort_order?: number;
  thumbnail_url?: string | null;
  description?: string;
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

/** Admin dashboard stats across all affiliates. */
export interface AdminDashboardStats {
  total_clicks: number;
  total_leads: number;
  total_orders: number;
  delivered_orders: number;
  pending_commission: number;
  available_commission: number;
  paid_commission: number;
}

/** Per-affiliate breakdown row for admin dashboard drill-down. */
export interface AdminDashboardBreakdownRow {
  affiliate_id: string;
  affiliate_code: string;
  affiliate_name: string;
  clicks: number;
  leads: number;
  orders: number;
  delivered_orders: number;
  pending_commission: number;
  available_commission: number;
  paid_commission: number;
}

/** Status of the commission on an order. Distinct from the order's own
 * fulfillment (order_status) and payment (payment_status), which this
 * feature does not touch. */
export type CommissionStatus = "pending" | "approved" | "paid" | "cancelled" | "fraud";

export interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  affiliate_id: string | null;
  affiliate_link_id: string | null;
  commission_rate: number | null;
  commission_amount: number | null;
  commission_status: CommissionStatus | null;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  /** Populated only by listMyOrders via a join to affiliate_links. */
  landing_page_name?: string | null;
}

export interface CreateOrderInput {
  order_code: string;
  affiliate_code: string;
  final_amount: number;
  customer_name: string;
  customer_phone: string;
  total_amount?: number | null | undefined;
  discount_amount?: number | null | undefined;
  customer_email?: string | null | undefined;
  campaign_slug?: string | null | undefined;
  payment_method?: string | null | undefined;
  shipping_address?: string | null | undefined;
  notes?: string | null | undefined;
}
