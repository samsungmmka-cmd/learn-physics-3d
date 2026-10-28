import { createClient } from '@supabase/supabase-js';

const OPTS = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

// Two kinds of client, both with the public anon key:
//  - anon():        for sign-up / sign-in / refresh
//  - asUser(token): every data request runs as the signed-in user, so row-level security applies.
export function createDb({ supabaseUrl, supabaseKey }) {
  return {
    anon: () => createClient(supabaseUrl, supabaseKey, OPTS),
    asUser: (token) => createClient(supabaseUrl, supabaseKey, {
      ...OPTS,
      global: { headers: { Authorization: `Bearer ${token}` } },
    }),
  };
}
