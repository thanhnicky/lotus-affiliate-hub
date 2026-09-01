import { supabase } from "@/integrations/supabase/client";
import { ServiceError, type AdminAffiliate, type AdminDashboardStats } from "@/types";

function mapAdminAffiliate(row: any): AdminAffiliate {
  return {
    id: row.id,
    user_id: row.user_id,
    affiliate_code: row.affiliate_code,
    full_name: row.full_name,
    phone: row.phone,
    email: row.email || null,
    zalo_id: row.zalo_id || null,
    bank_name: row.bank_name || null,
    bank_account: row.bank_account || null,
    bank_holder: row.bank_holder || null,
    commission_rate: row.commission_rate !== null ? Number(row.commission_rate) : undefined,
    total_earnings: row.total_earnings !== null ? Number(row.total_earnings) : undefined,
    pending_earnings: row.pending_earnings !== null ? Number(row.pending_earnings) : undefined,
    paid_earnings: row.paid_earnings !== null ? Number(row.paid_earnings) : undefined,
    status: row.status,
    role: row.role,
    approved_at: row.approved_at ?? null,
    created_at: row.created_at,
    order_count: Number(row.order_count ?? 0),
    approved_order_count: Number(row.approved_order_count ?? 0),
    pending_commission: Number(row.pending_commission ?? 0),
    available_commission: Number(row.available_commission ?? 0),
    paid_commission: Number(row.paid_commission ?? 0),
    last_order_at: row.last_order_at ?? null,
  } as AdminAffiliate;
}

export const adminService = {
  /** Admin-only: list all affiliates with order stats. */
  async listAffiliates(): Promise<AdminAffiliate[]> {
    const { data, error } = await supabase.rpc("admin_list_affiliates");
    if (error) {
      throw new ServiceError(error.message || "Không thể tải danh sách cộng tác viên.");
    }
    return (data ?? []).map(mapAdminAffiliate);
  },

  /** Admin-only: dashboard stats across all affiliates. */
  async getDashboardStats(period: "all" | "week" | "month" = "all"): Promise<AdminDashboardStats> {
    const { data, error } = await supabase.rpc("admin_dashboard_stats", {
      p_period: period,
    });
    if (error) {
      throw new ServiceError(error.message || "Không thể tải thống kê.");
    }
    const row = (data ?? [])[0];
    if (!row) {
      return {
        total_clicks: 0,
        total_leads: 0,
        total_orders: 0,
        delivered_orders: 0,
        pending_commission: 0,
        available_commission: 0,
        paid_commission: 0,
      };
    }
    return {
      total_clicks: Number(row.total_clicks ?? 0),
      total_leads: Number(row.total_leads ?? 0),
      total_orders: Number(row.total_orders ?? 0),
      delivered_orders: Number(row.delivered_orders ?? 0),
      pending_commission: Number(row.pending_commission ?? 0),
      available_commission: Number(row.available_commission ?? 0),
      paid_commission: Number(row.paid_commission ?? 0),
    };
  },
};
