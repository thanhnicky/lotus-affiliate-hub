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
  if (
    !affiliateCode ||
    affiliateCode.length > 64 ||
    !AFFILIATE_CODE_REGEX.test(affiliateCode)
  ) {
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

  // 4. Validate or generate visitor_id
  let visitorId: string;
  if (typeof raw["visitor_id"] === "string" && UUID_REGEX.test(raw["visitor_id"].trim())) {
    visitorId = raw["visitor_id"].trim().toLowerCase();
  } else {
    visitorId = crypto.randomUUID();
  }

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
