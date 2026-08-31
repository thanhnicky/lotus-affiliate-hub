/**
 * POST /api/affiliate/notify-commission
 *
 * Called by the admin UI after a commission status update succeeds.
 * Sends an email notification to the CTV about the status change.
 *
 * Body: { order_id: string, status: "approved"|"cancelled"|"paid", note?: string }
 *
 * Auth: the caller must include a valid Supabase session token
 * (Authorization: Bearer <access_token>). The endpoint verifies the
 * caller is an admin before sending.
 *
 * Email is sent via Resend (https://resend.com). Requires RESEND_API_KEY
 * and RESEND_FROM_EMAIL env vars. If not configured, the endpoint
 * returns 200 with { notified: false, reason: "email_not_configured" }
 * so the admin UI is not blocked.
 */

import { getSupabaseAdmin } from "./supabaseAdmin";

interface NotifyBody {
  order_id: string;
  status: "approved" | "cancelled" | "paid";
  note?: string;
}

interface OrderRow {
  id: string;
  order_code: string | null;
  customer_name: string;
  final_amount: number;
  commission_amount: number | null;
  commission_status: string;
  notes: string | null;
  affiliate_id: string | null;
}

interface AffiliateRow {
  id: string;
  full_name: string;
  email: string;
  affiliate_code: string;
}

export async function handleNotifyCommission(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // --- Auth: verify the caller is an admin via their Supabase token ---
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl =
    (typeof process !== "undefined" && process.env
      ? process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"]
      : undefined) || import.meta.env.VITE_SUPABASE_URL;

  // Anon/public key — required as apikey header for Supabase auth API
  const anonKey =
    (typeof process !== "undefined" && process.env
      ? process.env["VITE_SUPABASE_ANON_KEY"] || process.env["SUPABASE_ANON_KEY"]
      : undefined) || import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return json({ error: "Server config error" }, 500);
  }

  // Verify the token via Supabase auth API
  // apikey must be the project anon key, Authorization is the user JWT
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
  });
  if (!userRes.ok) {
    return json({ error: "Invalid session" }, 401);
  }
  const user = await userRes.json();

  // Check admin via service-role client
  const admin = getSupabaseAdmin();
  const { data: affiliateRow, error: affErr } = await admin
    .from("affiliates")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (affErr || !affiliateRow || affiliateRow.role !== "admin") {
    return json({ error: "Forbidden" }, 403);
  }

  // --- Parse body ---
  let body: NotifyBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.order_id || !body.status) {
    return json({ error: "Missing order_id or status" }, 400);
  }

  // --- Fetch order + affiliate info ---
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select(
      "id, order_code, customer_name, final_amount, commission_amount, commission_status, notes, affiliate_id",
    )
    .eq("id", body.order_id)
    .maybeSingle();

  if (orderErr || !order) {
    return json({ error: "Order not found" }, 404);
  }

  if (!order.affiliate_id) {
    return json({ notified: false, reason: "no_affiliate" }, 200);
  }

  // Get affiliate + email (email is in auth.users, not affiliates table)
  const { data: affiliate } = await admin
    .from("affiliates")
    .select("id, full_name, affiliate_code, user_id")
    .eq("id", order.affiliate_id)
    .maybeSingle();

  if (!affiliate) {
    return json({ notified: false, reason: "affiliate_not_found" }, 200);
  }

  // Get email from auth.users
  const { data: authUser } = await admin.auth.admin.getUserById(affiliate.user_id);
  const ctvEmail = authUser?.user?.email;

  if (!ctvEmail) {
    return json({ notified: false, reason: "no_email" }, 200);
  }

  // --- Check Resend config ---
  const resendKey =
    typeof process !== "undefined" && process.env ? process.env["RESEND_API_KEY"] : undefined;
  const fromEmail =
    typeof process !== "undefined" && process.env
      ? process.env["RESEND_FROM_EMAIL"] || "Lotus Affiliate <noreply@sonlotus.vn>"
      : "Lotus Affiliate <noreply@sonlotus.vn>";

  if (!resendKey) {
    // Email not configured — don't block the admin action
    console.warn("[notify-commission] RESEND_API_KEY not set, skipping email");
    return json({ notified: false, reason: "email_not_configured" }, 200);
  }

  // --- Build + send email ---
  const emailHtml = buildEmailHtml({
    status: body.status,
    ctfName: affiliate.full_name,
    orderCode: order.order_code || "—",
    customerName: order.customer_name,
    finalAmount: Number(order.final_amount),
    commissionAmount: order.commission_amount ? Number(order.commission_amount) : null,
    note: body.note || order.notes || undefined,
    affiliateCode: affiliate.affiliate_code,
  });

  const subject =
    body.status === "approved"
      ? "Hoa hồng của bạn đã được duyệt"
      : body.status === "paid"
        ? "Hoa hồng đã được thanh toán"
        : "Hoa hồng bị huỷ";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: ctvEmail,
        subject: `[Lotus Affiliate] ${subject}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[notify-commission] Resend error:", res.status, errText);
      return json({ notified: false, reason: "send_failed", detail: errText }, 200);
    }

    return json({ notified: true }, 200);
  } catch (err: any) {
    console.error("[notify-commission] Network error:", err?.message);
    return json({ notified: false, reason: "network_error" }, 200);
  }
}

// --- Helpers ---

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function formatVnd(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " ₫";
}

function buildEmailHtml(params: {
  status: string;
  ctfName: string;
  orderCode: string;
  customerName: string;
  finalAmount: number;
  commissionAmount: number | null;
  note?: string;
  affiliateCode: string;
}): string {
  const {
    status,
    ctfName,
    orderCode,
    customerName,
    finalAmount,
    commissionAmount,
    note,
    affiliateCode,
  } = params;

  const statusText =
    status === "approved" ? "đã được duyệt" : status === "paid" ? "đã được thanh toán" : "bị huỷ";

  const statusColor = status === "cancelled" ? "#dc2626" : "#16a34a";

  return `<!DOCTYPE html>
<html lang="vi">
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Be Vietnam Pro',Arial,sans-serif;">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
    <div style="background:#0d3b2e;padding:24px 32px;">
      <h1 style="color:#fff;font-size:20px;margin:0;font-weight:600;">Lotus Affiliate</h1>
      <p style="color:#a7c4ba;font-size:13px;margin:4px 0 0;">Thông báo hoa hồng</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#18181b;margin:0 0 4px;">Xin chào ${escapeHtml(ctfName)},</p>
      <p style="font-size:15px;color:#52525b;margin:12px 0 24px;line-height:1.6;">
        Hoa hồng của đơn hàng <strong>${escapeHtml(orderCode)}</strong> ${statusText}.
      </p>

      <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin:0 0 20px;">
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr>
            <td style="color:#71717a;padding:6px 0;width:40%;">Mã CTV</td>
            <td style="color:#18181b;font-weight:500;padding:6px 0;">${escapeHtml(affiliateCode)}</td>
          </tr>
          <tr>
            <td style="color:#71717a;padding:6px 0;">Mã đơn hàng</td>
            <td style="color:#18181b;font-weight:500;padding:6px 0;">${escapeHtml(orderCode)}</td>
          </tr>
          <tr>
            <td style="color:#71717a;padding:6px 0;">Khách hàng</td>
            <td style="color:#18181b;font-weight:500;padding:6px 0;">${escapeHtml(customerName)}</td>
          </tr>
          <tr>
            <td style="color:#71717a;padding:6px 0;">Giá trị đơn</td>
            <td style="color:#18181b;font-weight:500;padding:6px 0;">${formatVnd(finalAmount)}</td>
          </tr>
          ${
            commissionAmount !== null
              ? `
          <tr>
            <td style="color:#71717a;padding:6px 0;">Hoa hồng</td>
            <td style="color:${statusColor};font-weight:600;padding:6px 0;">${formatVnd(commissionAmount)}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="color:#71717a;padding:6px 0;">Trạng thái</td>
            <td style="color:${statusColor};font-weight:600;padding:6px 0;">${statusText}</td>
          </tr>
        </table>
      </div>

      ${
        note
          ? `
      <div style="border-left:3px solid ${statusColor};padding:12px 16px;background:#f9fafb;border-radius:0 8px 8px 0;margin:0 0 20px;">
        <p style="font-size:13px;color:#71717a;margin:0 0 4px;">Ghi chú từ Lotus:</p>
        <p style="font-size:14px;color:#18181b;margin:0;line-height:1.5;">${escapeHtml(note)}</p>
      </div>`
          : ""
      }

      <p style="font-size:13px;color:#71717a;margin:24px 0 0;line-height:1.6;">
        Bạn có thể xem chi tiết tại <a href="https://aff.sonlotus.vn/dashboard" style="color:#0d3b2e;font-weight:500;">aff.sonlotus.vn</a>.
        <br/>Câu hỏi? Liên hệ 0943 966 662 · sales@sonlotus.vn
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #e4e4e7;">
      <p style="font-size:12px;color:#a1a1aa;margin:0;">
        © ${new Date().getFullYear()} Công ty TNHH SX TM DV Bích Trang — Sơn Lotus.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
