import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== "undefined" && process.env
    ? process.env["VITE_SUPABASE_URL"]
    : undefined);

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (typeof process !== "undefined" && process.env
    ? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]
    : undefined);

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Thiếu cấu hình kết nối Supabase. Vui lòng kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY."
  );
}

if (import.meta.env.DEV) {
  console.info("[Supabase Client Debug]", {
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasSupabaseKey: Boolean(supabasePublishableKey),
    currentOrigin: typeof window !== "undefined" ? window.location.origin : "server",
  });
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});





