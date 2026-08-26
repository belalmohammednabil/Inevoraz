import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

// Falls back to harmless placeholders so the app can still boot (and show a
// clear "not configured" screen) if the developer hasn't set env vars yet.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "public-anon-placeholder-key"
);
