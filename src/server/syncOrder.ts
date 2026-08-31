import { getSupabaseAdmin } from "./supabaseAdmin";

/**
 * POST /api/affiliate/sync-order — called server-to-server by an automation
 * (Pipedream/Zapier) reading new rows from the Google Sheet that OrderForm
 * submits to. Not called from a browser, so there is no Origin/CORS handling
 * here (CORS is a browser-only mechanism); instead the caller must present
 * the shared secret configured in ORDER_SYNC_SECRET.
 *
 * All the actual order/commission logic lives in the admin_create_order
 * Postgres function (shared with the admin portal's manual "create order"
 * action), including the order_code-based idempotency (order_code is UNIQUE
 * on the orders table) that makes it safe for the automation to re-POST the
 * same sheet row.
 */
export async function handleSyncOrder(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/affiliate/sync-order") {
    return json({ success: false, error: "Not Found" }, 404);
  }
  if (request.method !== "POST") {
    return json({ success: false, error: "Phương thức không được hỗ trợ." }, 405, {
      Allow: "POST",
    });
  }

  const secret = getSyncSecret();
  if (!secret) {
    return json({ success: false, error: "Lỗi cấu hình hệ thống." }, 500);
  }
  const provided = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!timingSafeEqual(provided, secret)) {
    return json({ success: false, error: "Không có quyền truy cập." }, 403);
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ success: false, error: "Dữ liệu yêu cầu không hợp lệ." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Dữ liệu yêu cầu không hợp lệ." }, 400);
  }
  const raw = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  const orderCode = str(raw["order_code"] ?? raw["order_id"]);
  const finalAmount = Number(raw["final_amount"] ?? raw["totalPrice"]);
  const customerName = str(raw["customer_name"] ?? raw["name"]);
  const customerPhone = str(raw["customer_phone"] ?? raw["phone"]);
  if (
    !orderCode ||
    !Number.isFinite(finalAmount) ||
    finalAmount <= 0 ||
    !customerName ||
    !customerPhone
  ) {
    return json({ success: false, error: "Dữ liệu yêu cầu không hợp lệ." }, 400);
  }

  const isDev =
    import.meta.env.DEV ||
    (typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production");

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const totalAmount = Number(raw["total_amount"] ?? raw["originalPrice"]);
    const discountAmount = Number(raw["discount_amount"]);

    const { data, error } = await supabaseAdmin.rpc("admin_create_order", {
      p_order_code: orderCode,
      p_affiliate_code: str(raw["affiliate_code"]) || null,
      p_final_amount: finalAmount,
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_total_amount: Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : null,
      p_discount_amount: Number.isFinite(discountAmount) ? discountAmount : null,
      p_customer_email: str(raw["customer_email"] ?? raw["email"]) || null,
      p_campaign_slug: str(raw["campaign_slug"]) || null,
      p_payment_method: str(raw["payment_method"] ?? raw["paymentMethod"]) || null,
      p_shipping_address: str(raw["shipping_address"] ?? raw["province"]) || null,
      p_notes: str(raw["notes"] ?? raw["note"]) || null,
      p_affiliate_link_id: str(raw["affiliate_link_id"]) || null,
    });

    if (error) {
      if (isDev) console.error("[Sync Order Error]", error.code);
      return json({ success: false, error: "Lỗi hệ thống khi ghi nhận đơn hàng." }, 500);
    }

    return json({ success: true, order: data }, 200);
  } catch (err) {
    if (isDev) console.error("[Sync Order Error]", err instanceof Error ? err.name : "UNKNOWN");
    return json({ success: false, error: "Lỗi hệ thống khi ghi nhận đơn hàng." }, 500);
  }
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getSyncSecret(): string | undefined {
  return typeof process !== "undefined" && process.env
    ? process.env["ORDER_SYNC_SECRET"]
    : undefined;
}

/** Constant-time comparison so response timing can't be used to guess the secret. */
function timingSafeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function json(body: unknown, status: number, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
