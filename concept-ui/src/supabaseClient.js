// Single shared Supabase client. Credentials come from env (VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY) — never hardcode them here. This re-exports the one
// client instance from ./lib/supabase so the whole app shares a single auth
// session instead of running two separate clients.
export { supabase } from './lib/supabase';
