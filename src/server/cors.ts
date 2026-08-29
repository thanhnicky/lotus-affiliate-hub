export const ALLOWED_ORIGINS = [
  "https://son-gia-go-tam-xi-mang.sonlotus.vn",
  "https://son-gia-go-kim-loai.sonlotus.vn",
  "https://son-kim-loai.sonlotus.vn",
  "https://son-go.sonlotus.vn",
] as const;

export type AllowedOrigin = (typeof ALLOWED_ORIGINS)[number];

export function isAllowedOrigin(origin: string | null | undefined): origin is AllowedOrigin {
  if (!origin) return false;
  return (ALLOWED_ORIGINS as readonly string[]).includes(origin);
}

export function getCorsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
