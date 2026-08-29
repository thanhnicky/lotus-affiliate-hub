import { isAllowedOrigin, getCorsHeaders } from "./cors";
import { validateAndCanonicalizeTrackLead } from "./validation";
import { getSupabaseAdmin } from "./supabaseAdmin";

/** A repeat of the same lead type from the same visitor inside this window is ignored. */
const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

export async function handleTrackLead(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname !== "/api/affiliate/track-lead") {
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

  // Handle OPTIONS preflight. The landing pages POST application/json, which is
  // not a CORS-safelisted content type, so this preflight is mandatory: without
  // it every lead request is blocked by the browser.
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
  const validation = validateAndCanonicalizeTrackLead(body);
  if (!validation.valid || !validation.data) {
    return new Response(
      JSON.stringify({ success: false, error: "Dữ liệu yêu cầu không hợp lệ." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const {
    affiliate_code,
    affiliate_link_id: claimedLinkId,
    landing_page_id: claimedPageId,
    visitor_id,
    lead_type,
    lead_source,
    lead_data,
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
    // Step 1: Re-resolve the attribution server-side. The ids in the request body
    // are a client-supplied claim; trusting them would let anyone forge leads for
    // any affiliate. Only the resolved values are ever stored.
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      "resolve_affiliate_attribution",
      {
        p_affiliate_code: affiliate_code,
        p_landing_page_url: lead_source,
      }
    );

    const attribution = Array.isArray(rpcData) ? rpcData[0] : rpcData;

    if (rpcError || !attribution || !attribution.affiliate_link_id) {
      if (isDev && rpcError) {
        console.error("[Track Lead RPC Error]", rpcError.code);
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: "Affiliate link không hợp lệ hoặc không còn hoạt động.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const affiliateLinkId: string = attribution.affiliate_link_id;
    const affiliateId: string = attribution.affiliate_id;
    const landingPageId: string = attribution.landing_page_id;
    const resolvedAffiliateCode: string = attribution.affiliate_code || affiliate_code;

    // Step 2: The claim must match what the server resolved, otherwise the caller
    // is attributing a lead to a link that does not belong to this code.
    const linkMatches = claimedLinkId === String(affiliateLinkId).toLowerCase();
    const pageMatches = claimedPageId === String(landingPageId).toLowerCase();
    if (!linkMatches || !pageMatches) {
      return new Response(
        JSON.stringify({ success: false, error: "Thông tin quy gán không khớp." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Dedupe the same lead type from the same visitor within the window,
    // so a double submit or a repeated CTA tap cannot inflate the lead count.
    const windowStart = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
    const { data: recentLeads, error: dedupeError } = await supabaseAdmin
      .from("affiliate_leads")
      .select("id, created_at")
      .eq("visitor_id", visitor_id)
      .eq("affiliate_link_id", affiliateLinkId)
      .eq("lead_type", lead_type)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false })
      .limit(1);

    const existing = !dedupeError && recentLeads ? recentLeads[0] : undefined;
    if (existing) {
      return new Response(
        JSON.stringify({
          success: true,
          lead_id: existing.id,
          affiliate_code: resolvedAffiliateCode,
          affiliate_link_id: affiliateLinkId,
          landing_page_id: landingPageId,
          visitor_id: visitor_id,
          lead_type: lead_type,
          created_at: existing.created_at,
          duplicate: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Insert the lead.
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("affiliate_leads")
      .insert({
        affiliate_id: affiliateId,
        affiliate_link_id: affiliateLinkId,
        landing_page_id: landingPageId,
        affiliate_code: resolvedAffiliateCode,
        visitor_id: visitor_id,
        lead_type: lead_type,
        lead_source: lead_source,
        lead_data: lead_data,
      })
      .select("id, created_at")
      .single();

    if (insertError || !inserted) {
      if (isDev && insertError) {
        console.error("[Track Lead Insert Error]", insertError.code);
      }
      return new Response(
        JSON.stringify({ success: false, error: "Lỗi hệ thống khi ghi nhận lead." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 5: Return 200 Response
    return new Response(
      JSON.stringify({
        success: true,
        lead_id: inserted.id,
        affiliate_code: resolvedAffiliateCode,
        affiliate_link_id: affiliateLinkId,
        landing_page_id: landingPageId,
        visitor_id: visitor_id,
        lead_type: lead_type,
        created_at: inserted.created_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    // Never echo the error: lead_data holds customer PII.
    if (isDev) {
      console.error("[Track Lead Error]", err instanceof Error ? err.name : "UNKNOWN");
    }
    return new Response(
      JSON.stringify({ success: false, error: "Lỗi hệ thống khi ghi nhận lead." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
