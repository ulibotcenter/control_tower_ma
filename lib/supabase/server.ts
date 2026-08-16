import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseServiceKey, supabaseUrl } from "../config";

export function createSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  try {
    return createClient(supabaseUrl(), supabaseServiceKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.error("[supabase] não foi possível criar o cliente admin", err);
    return null;
  }
}
