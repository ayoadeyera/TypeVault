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

// ─── Goal & Diagnostic Cloud Sync Helpers ─────────────────────────────────────

/**
 * Upsert user goal settings into the `user_goals` table.
 */
export async function upsertUserGoals(goals) {
  try {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const payload = {
      user_id: user.id,
      daily_minutes: goals.dailyMinutes,
      weekly_minutes: goals.weeklyMinutes,
      monthly_minutes: goals.monthlyMinutes,
      target_wpm_speed: goals.targetWpmSpeed,
      target_wpm_accuracy: goals.targetWpmAccuracy,
      target_wpm_code: goals.targetWpmCode,
      target_accuracy: goals.targetAccuracy,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_goals')
      .upsert(payload, { onConflict: 'user_id' })
      .select();

    return { data, error };
  } catch (e) {
    console.warn('TypeVault: upsertUserGoals error:', e);
    return { data: null, error: e };
  }
}

/**
 * Fetch user goal settings from the `user_goals` table.
 */
export async function getUserGoals() {
  try {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    return { data, error };
  } catch (e) {
    console.warn('TypeVault: getUserGoals error:', e);
    return { data: null, error: e };
  }
}

/**
 * Upsert cumulative character error analytics into `character_analytics` table.
 * Supports storing character metrics either as aggregated rows or json payload.
 */
export async function upsertCharacterAnalytics(charData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const payload = {
      user_id: user.id,
      analytics_data: charData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('character_analytics')
      .upsert(payload, { onConflict: 'user_id' })
      .select();

    return { data, error };
  } catch (e) {
    console.warn('TypeVault: upsertCharacterAnalytics error:', e);
    return { data: null, error: e };
  }
}

/**
 * Fetch character analytics from `character_analytics` table.
 */
export async function getCharacterAnalytics() {
  try {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('character_analytics')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    return { data, error };
  } catch (e) {
    console.warn('TypeVault: getCharacterAnalytics error:', e);
    return { data: null, error: e };
  }
}

