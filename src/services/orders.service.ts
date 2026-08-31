import { supabase } from "@/integrations/supabase/client";
import { ServiceError, type CreateOrderInput, type Order, type OrderStatus } from "@/types";

function mapOrder(row: any): Order {
  return {
    id: row.id,
    external_reference: row.external_reference,
    affiliate_id: row.affiliate_id,
    affiliate_link_id: row.affiliate_link_id,
    affiliate_code: row.affiliate_code,
    order_value: Number(row.order_value ?? 0),
    commission_rate: row.commission_rate === null ? null : Number(row.commission_rate),
    commission_amount: Number(row.commission_amount ?? 0),
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    status: row.status,
    source: row.source,
    note: row.note,
    created_by: row.created_by,
    approved_by: row.approved_by,
    approved_at: row.approved_at,
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

  /** Admin-only: creates an order and applies the commission bookkeeping atomically. */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    if (!input.affiliate_code?.trim()) {
      throw new ServiceError("Vui lòng nhập mã cộng tác viên.");
    }
    if (!Number.isFinite(input.order_value) || input.order_value <= 0) {
      throw new ServiceError("Giá trị đơn hàng không hợp lệ.");
    }

    const { data, error } = await supabase.rpc("admin_create_order", {
      p_external_reference: input.external_reference,
      p_affiliate_code: input.affiliate_code.trim(),
      p_order_value: input.order_value,
      p_customer_name: input.customer_name?.trim() || null,
      p_customer_phone: input.customer_phone?.trim() || null,
      p_campaign_slug: input.campaign_slug?.trim() || null,
      p_source: "manual",
    });

    if (error) {
      throw new ServiceError(error.message || "Không thể tạo đơn hàng.");
    }
    return mapOrder(data);
  },

  /** Admin-only: approve or reject a pending order. */
  async updateOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<Order> {
    const { data, error } = await supabase.rpc("admin_update_order_status", {
      p_order_id: orderId,
      p_status: status,
      p_note: note?.trim() || null,
    });

    if (error) {
      throw new ServiceError(error.message || "Không thể cập nhật đơn hàng.");
    }
    return mapOrder(data);
  },
};
