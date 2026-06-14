// =========================================================
// SUPABASE CLIENT CONFIGURATION
// Developer: Ami Adebayo
// Role: Senior Developer / Senior Design Developer
//
// Purpose:
// Connects the Gabniks Motors website to Supabase using the
// public project URL and anon public key from the .env file.
//
// Important:
// Never place the service_role secret key in frontend code.
// Only the anon/public key belongs here.
// =========================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);