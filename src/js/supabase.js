/* ==========================================================================
   TypeVault - Supabase Client & Auth Helpers
   Initialized once and exported for use across the app.
   ========================================================================== */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('TypeVault: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

/** Singleton Supabase client — import this for direct DB/storage access */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

/**
 * Register a new user with email, password, and optional username.
 * Supabase may require email confirmation depending on your project settings.
 */
export async function signUpUser(email, password, username = '') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username || email.split('@')[0]
      }
    }
  });
  return { data, error };
}

/**
 * Sign in an existing user with email and password.
 */
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

/**
 * Trigger Google OAuth redirect. Requires Google provider enabled in
 * Supabase Dashboard → Authentication → Providers → Google.
 */
export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  return { data, error };
}

/**
 * Sign out the currently authenticated user.
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Returns the currently authenticated user object, or null if guest.
 * Makes a network call to verify the session is still valid.
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
