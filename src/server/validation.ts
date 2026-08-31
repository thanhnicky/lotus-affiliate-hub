import { isAllowedOrigin } from "./cors";

const AFFILIATE_CODE_REGEX = /^[A-Z0-9-]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface TrackClickInput {
  affiliate_code: string;
  landing_page_url: string;
  campaign?: string | null;
  visitor_id: string;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

export interface ValidationResult {
  valid: boolean;
  data?: TrackClickInput;
  error?: string;
}

function sanitizeOptionalString(val: unknown, maxLen = 100): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

export const LEAD_TYPES = ["form_submit", "zalo_click", "phone_click", "email_click"] as const;
export type LeadType = (typeof LEAD_TYPES)[number];

/** Customer or Lotus contact details attached to a lead. */
export interface LeadData {
  name?: string;
  phone?: string;
  email?: string;
  zalo_phone?: string;
  province?: string;
  district?: string;
  product_interest?: string;
  area_sqm?: number;
  message?: string;
}

export interface TrackLeadInput {
  affiliate_code: string;
  affiliate_link_id: string;
  landing_page_id: string;
  visitor_id: string;
  lead_type: LeadType;
  lead_source: string;
  lead_data: LeadData;
}

export interface TrackLeadValidationResult {
  valid: boolean;
  data?: TrackLeadInput;
  error?: string;
}

function normalizeUuid(val: unknown): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  return UUID_REGEX.test(trimmed) ? trimmed.toLowerCase() : null;
}

/** Whitelist of lead_data keys with their maximum stored length. */
const LEAD_DATA_TEXT_FIELDS: ReadonlyArray<[keyof LeadData, number]> = [
  ["name", 120],
  ["phone", 20],
  ["email", 160],
  ["zalo_phone", 20],
  ["province", 80],
  ["district", 80],
  ["product_interest", 300],
  ["message", 1000],
];

/**
 * Copies only whitelisted keys, so an unexpected field sent by a client (or an
 * attempt to smuggle a large payload into jsonb) never reaches the database.
 */
function sanitizeLeadData(val: unknown): LeadData {
  if (!val || typeof val !== "object" || Array.isArray(val)) return {};
  const raw = val as Record<string, unknown>;
  const out: LeadData = {};

  for (const [key, maxLen] of LEAD_DATA_TEXT_FIELDS) {
    const value = sanitizeOptionalString(raw[key], maxLen);
    if (value) out[key] = value as never;
  }

  const area = raw["area_sqm"];
  const areaNum = typeof area === "number" ? area : Number(area);
  if (Number.isFinite(areaNum) && areaNum > 0 && areaNum <= 1_000_000) {
    out.area_sqm = Math.round(areaNum * 100) / 100;
  }

  return out;
}

export function validateAndCanonicalizeTrackLead(body: unknown): TrackLeadValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }

  const raw = body as Record<string, unknown>;

  // 1. affiliate_code
  if (typeof raw["affiliate_code"] !== "string") {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }
  const affiliateCode = raw["affiliate_code"].trim().toUpperCase();
  if (!affiliateCode || affiliateCode.length > 64 || !AFFILIATE_CODE_REGEX.test(affiliateCode)) {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }

  // 2. UUID fields. Unlike track-click these arrive from the client, so they are
  //    only accepted as a claim here and re-verified against the server-resolved
  //    attribution before anything is written.
  const affiliateLinkId = normalizeUuid(raw["affiliate_link_id"]);
  const landingPageId = normalizeUuid(raw["landing_page_id"]);
  const visitorId = normalizeUuid(raw["visitor_id"]);
  if (!affiliateLinkId || !landingPageId || !visitorId) {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }

  // 3. lead_type
  const leadType = typeof raw["lead_type"] === "string" ? raw["lead_type"].trim() : "";
  if (!(LEAD_TYPES as readonly string[]).includes(leadType)) {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }

  // 4. lead_source, canonicalised exactly like track-click's landing_page_url
  if (typeof raw["lead_source"] !== "string") {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(raw["lead_source"]);
  } catch {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }
  if (parsedUrl.protocol !== "https:" || !isAllowedOrigin(parsedUrl.origin)) {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }

  return {
    valid: true,
    data: {
      affiliate_code: affiliateCode,
      affiliate_link_id: affiliateLinkId,
      landing_page_id: landingPageId,
      visitor_id: visitorId,
      lead_type: leadType as LeadType,
      lead_source: `${parsedUrl.origin}/`,
      lead_data: sanitizeLeadData(raw["lead_data"]),
    },
  };
}

export function validateAndCanonicalizeTrackClick(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }

  const raw = body as Record<string, unknown>;

  // 1. Validate affiliate_code
  if (typeof raw["affiliate_code"] !== "string") {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }
  const affiliateCode = raw["affiliate_code"].trim().toUpperCase();
  if (!affiliateCode || affiliateCode.length > 64 || !AFFILIATE_CODE_REGEX.test(affiliateCode)) {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }

  // 2. Validate and canonicalize landing_page_url
  if (typeof raw["landing_page_url"] !== "string") {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(raw["landing_page_url"]);
  } catch {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }

  if (parsedUrl.protocol !== "https:") {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }

  if (!isAllowedOrigin(parsedUrl.origin)) {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }

  const canonicalLandingPageUrl = `${parsedUrl.origin}/`;

  // 3. Optional campaign, utm_medium, utm_campaign
  const campaign = sanitizeOptionalString(raw["campaign"]);
  const utmMedium = sanitizeOptionalString(raw["utm_medium"]);
  const utmCampaign = sanitizeOptionalString(raw["utm_campaign"]);

  // 4. visitor_id is REQUIRED. Previously a missing/invalid visitor_id was
  // replaced with a fresh random UUID, which let an attacker flood clicks
  // with no dedupe by simply omitting visitor_id. Now we reject instead.
  if (typeof raw["visitor_id"] !== "string" || !UUID_REGEX.test(raw["visitor_id"].trim())) {
    return { valid: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }
  const visitorId = raw["visitor_id"].trim().toLowerCase();

  return {
    valid: true,
    data: {
      affiliate_code: affiliateCode,
      landing_page_url: canonicalLandingPageUrl,
      campaign,
      visitor_id: visitorId,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    },
  };
}
