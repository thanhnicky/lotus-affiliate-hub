import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const supabaseUrl =
    (typeof process !== "undefined" && process.env
      ? process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"]
      : undefined) || import.meta.env.VITE_SUPABASE_URL;

  const serviceRoleKey =
    typeof process !== "undefined" && process.env
      ? process.env["SUPABASE_SERVICE_ROLE_KEY"]
      : undefined;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SERVER_CONFIG_ERROR");
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
