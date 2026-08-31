import { supabase } from "@/integrations/supabase/client";
import { ServiceError, type CommissionStatus, type CreateOrderInput, type Order } from "@/types";

function mapOrder(row: any): Order {
  return {
    id: row.id,
    order_code: row.order_code,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_email: row.customer_email,
    total_amount: Number(row.total_amount ?? 0),
    discount_amount: Number(row.discount_amount ?? 0),
    final_amount: Number(row.final_amount ?? 0),
    affiliate_id: row.affiliate_id,
    affiliate_link_id: row.affiliate_link_id,
    commission_rate: row.commission_rate === null ? null : Number(row.commission_rate),
    commission_amount: row.commission_amount === null ? null : Number(row.commission_amount),
    commission_status: row.commission_status,
    order_status: row.order_status,
    payment_status: row.payment_status,
    payment_method: row.payment_method,
    shipping_address: row.shipping_address,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const ordersService = {
  /** Every order, newest first. RLS limits this to an admin's view; a plain affiliate only sees their own. */
  async listOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new ServiceError(error.message || "Không thể tải danh sách đơn hàng.");
    }
    return (data ?? []).map(mapOrder);
  },

  /** Orders for a specific affiliate (the CTV's own orders), newest first.
   *  Joins affiliate_links -> landing_pages to surface the landing page name per order. */
  async listMyOrders(affiliateId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*, affiliate_links(landing_pages(name))")
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new ServiceError(error.message || "Không thể tải đơn hàng của bạn.");
    }
    return (data ?? []).map((row: any) => ({
      ...mapOrder(row),
      landing_page_name: row.affiliate_links?.landing_pages?.name ?? null,
    }));
  },

  /** Admin-only: creates an order and applies the commission bookkeeping atomically. */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    if (!input.affiliate_code?.trim()) {
      throw new ServiceError("Vui lòng nhập mã cộng tác viên.");
    }
    if (!Number.isFinite(input.final_amount) || input.final_amount <= 0) {
      throw new ServiceError("Giá trị đơn hàng không hợp lệ.");
    }
    if (!input.customer_name?.trim() || !input.customer_phone?.trim()) {
      throw new ServiceError("Vui lòng nhập tên và số điện thoại khách hàng.");
    }

    const { data, error } = await supabase.rpc("admin_create_order", {
      p_order_code: input.order_code,
      p_affiliate_code: input.affiliate_code.trim(),
      p_final_amount: input.final_amount,
      p_customer_name: input.customer_name.trim(),
      p_customer_phone: input.customer_phone.trim(),
      p_total_amount: input.total_amount ?? null,
      p_discount_amount: input.discount_amount ?? null,
      p_customer_email: input.customer_email?.trim() || null,
      p_campaign_slug: input.campaign_slug?.trim() || null,
      p_payment_method: input.payment_method?.trim() || null,
      p_shipping_address: input.shipping_address?.trim() || null,
      p_notes: input.notes?.trim() || null,
    });

    if (error) {
      throw new ServiceError(error.message || "Không thể tạo đơn hàng.");
    }
    return mapOrder(data);
  },

  /** Admin-only: approve, cancel, or mark paid the commission on an order.
   *  Also triggers an email notification to the CTV via the notify-commission
   *  server endpoint. Email failure is non-blocking (status update already
   *  succeeded). */
  async updateCommissionStatus(
    orderId: string,
    status: Extract<CommissionStatus, "approved" | "cancelled" | "paid">,
    note?: string,
  ): Promise<Order> {
    const { data, error } = await supabase.rpc("admin_update_commission_status", {
      p_order_id: orderId,
      p_status: status,
      p_note: note?.trim() || null,
    });

    if (error) {
      throw new ServiceError(error.message || "Không thể cập nhật đơn hàng.");
    }

    // Fire-and-forget email notification (non-blocking)
    void this.notifyCommission(orderId, status, note).catch((e) => {
      console.warn("[orders] notify-commission failed:", e?.message);
    });

    return mapOrder(data);
  },

  /** Sends an email notification to the CTV about a commission status change. */
  async notifyCommission(
    orderId: string,
    status: Extract<CommissionStatus, "approved" | "cancelled" | "paid">,
    note?: string,
  ): Promise<{ notified: boolean; reason?: string }> {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) return { notified: false, reason: "no_session" };

    const res = await fetch("/api/affiliate/notify-commission", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id: orderId, status, note }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { notified: false, reason: errBody.error || "request_failed" };
    }

    return await res.json();
  },
};
