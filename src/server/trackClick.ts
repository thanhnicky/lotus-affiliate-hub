import { isAllowedOrigin, getCorsHeaders } from "./cors";
import { validateAndCanonicalizeTrackClick } from "./validation";
import { getSupabaseAdmin } from "./supabaseAdmin";

export async function handleTrackClick(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname !== "/api/affiliate/track-click") {
    return new Response(
      JSON.stringify({ success: false, error: "Not Found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const origin = request.headers.get("Origin");
  const testHeader = request.headers.get("X-Tracking-Test");
  const isDev =
    import.meta.env.DEV ||
    (typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production");
  const isDevTestBypass = isDev && testHeader === "lotus-local-test";

  // Handle OPTIONS preflight
  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin(origin)) {
      return new Response(
        JSON.stringify({ success: false, error: "Nguồn gốc yêu cầu không được phép." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }

  // Only POST allowed
  if (request.method !== "POST") {
    const errorOrigin = isAllowedOrigin(origin) ? origin : undefined;
    return new Response(
      JSON.stringify({ success: false, error: "Phương thức không được hỗ trợ." }),
      {
        status: 405,
        headers: {
          ...(errorOrigin ? getCorsHeaders(errorOrigin) : {}),
          "Content-Type": "application/json",
          "Allow": "POST, OPTIONS",
        },
      }
    );
  }

  // Validate Origin
  let effectiveOrigin: string;
  if (isAllowedOrigin(origin)) {
    effectiveOrigin = origin;
  } else if (isDevTestBypass) {
    effectiveOrigin = "https://son-go.sonlotus.vn";
  } else {
    return new Response(
      JSON.stringify({ success: false, error: "Nguồn gốc yêu cầu không được phép." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const corsHeaders = getCorsHeaders(effectiveOrigin);

  // Validate Content-Type
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return new Response(
      JSON.stringify({ success: false, error: "Dữ liệu yêu cầu không hợp lệ." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Parse Body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Dữ liệu yêu cầu không hợp lệ." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate Input
  const validation = validateAndCanonicalizeTrackClick(body);
  if (!validation.valid || !validation.data) {
    return new Response(
      JSON.stringify({ success: false, error: "Dữ liệu yêu cầu không hợp lệ." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const {
    affiliate_code,
    landing_page_url,
    campaign,
    visitor_id,
    utm_medium,
    utm_campaign,
  } = validation.data;

  // Get Supabase Admin Client
  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Lỗi cấu hình hệ thống." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Step 2: Call Supabase RPC resolve_affiliate_attribution
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      "resolve_affiliate_attribution",
      {
        p_affiliate_code: affiliate_code,
        p_landing_page_url: landing_page_url,
      }
    );

    if (rpcError) {
      if (isDev) {
        console.error("[Track Click RPC Error]", rpcError.code);
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: "Affiliate link không hợp lệ hoặc không còn hoạt động.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle table return (array) or single object
    const attribution = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!attribution || !attribution.affiliate_link_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Affiliate link không hợp lệ hoặc không còn hoạt động.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const affiliateLinkId = attribution.affiliate_link_id;
    const affiliateId = attribution.affiliate_id;
    const landingPageId = attribution.landing_page_id;
    const resolvedAffiliateCode = attribution.affiliate_code || affiliate_code;
    const cookieDurationDays = attribution.cookie_duration_days || 60;
    const expiresAt = new Date(
      Date.now() + cookieDurationDays * 24 * 60 * 60 * 1000
    ).toISOString();

    // Step 3: Dedupe Click (within 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentAttributions, error: dedupeError } = await supabaseAdmin
      .from("affiliate_attributions")
      .select("id")
      .eq("visitor_id", visitor_id)
      .eq("affiliate_link_id", affiliateLinkId)
      .gte("created_at", thirtyMinutesAgo)
      .limit(1);

    let counted = false;

    if (!dedupeError && recentAttributions && recentAttributions.length > 0) {
      // Duplicate click within 30 minutes
      counted = false;
    } else {
      // Step 4: Record click count & insert attribution
      await supabaseAdmin.rpc("record_affiliate_click", {
        p_affiliate_link_id: affiliateLinkId,
      });

      const utmMediumFinal = utm_medium || "affiliate";
      const utmCampaignFinal = utm_campaign || campaign || null;

      await supabaseAdmin.from("affiliate_attributions").insert({
        affiliate_id: affiliateId,
        affiliate_link_id: affiliateLinkId,
        affiliate_code: resolvedAffiliateCode,
        landing_page_id: landingPageId,
        visitor_id: visitor_id,
        utm_source: "affiliate",
        utm_medium: utmMediumFinal,
        utm_campaign: utmCampaignFinal,
        expires_at: expiresAt,
      });

      counted = true;
    }

    // Step 5: Return 200 Response
    const responsePayload = {
      success: true,
      affiliate_code: resolvedAffiliateCode,
      affiliate_link_id: affiliateLinkId,
      landing_page_id: landingPageId,
      visitor_id: visitor_id,
      expires_at: expiresAt,
      cookie_duration_days: cookieDurationDays,
      counted: counted,
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    if (isDev) {
      console.error("[Track Click Error]", err instanceof Error ? err.name : "UNKNOWN");
    }
    return new Response(
      JSON.stringify({ success: false, error: "Lỗi hệ thống khi ghi nhận click." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
