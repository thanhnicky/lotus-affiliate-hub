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
 * action), including the external_reference-based idempotency that makes it
 * safe for the automation to re-POST the same sheet row.
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

  const externalReference = str(raw["external_reference"] ?? raw["order_id"]);
  const orderValue = Number(raw["order_value"] ?? raw["totalPrice"]);
  if (!externalReference || !Number.isFinite(orderValue) || orderValue <= 0) {
    return json({ success: false, error: "Dữ liệu yêu cầu không hợp lệ." }, 400);
  }

  const isDev =
    import.meta.env.DEV ||
    (typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production");

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.rpc("admin_create_order", {
      p_external_reference: externalReference,
      p_affiliate_code: str(raw["affiliate_code"]) || null,
      p_order_value: orderValue,
      p_customer_name: str(raw["customer_name"] ?? raw["name"]) || null,
      p_customer_phone: str(raw["customer_phone"] ?? raw["phone"]) || null,
      p_campaign_slug: str(raw["campaign_slug"]) || null,
      p_source: "sheets_sync",
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
