/**
 * @file frontend/src/services/supabaseClient.js
 * @notice Supabase Cloud Storage Client for Parda Encrypted Health Vault
 */

import { createClient } from '@supabase/supabase-js';

// Supabase project URL and anon public key
export const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://shkicyvjgnsypvsamicc.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GpGH2XemJfzBtuN692CVBQ_zLK8XTf_';

let client = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
    });
  } catch (err) {
    console.warn('[Parda] Failed to initialize Supabase client:', err);
  }
}

export const supabase = client;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 10);
}
