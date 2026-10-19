/* ==========================================================================
   TypeVault - Local Storage Manager
   ========================================================================== */

import { DEFAULT_CUSTOM_SNIPPETS } from './modes.js';
import { supabase, upsertUserGoals, getUserGoals, upsertCharacterAnalytics, getCharacterAnalytics } from './supabase.js';

const STORAGE_KEYS = {
  SETTINGS: 'typevault_settings',
  SNIPPETS: 'typevault_custom_snippets',
  HISTORY: 'typevault_session_history',
  PERSONAL_BEST: 'typevault_personal_best',
  GOALS: 'typevault_user_goals',
  DURATION_LOGS: 'typevault_duration_logs',
  CHAR_ANALYTICS: 'typevault_character_analytics'
};

const DEFAULT_SETTINGS = {
  theme: 'dark',
  font: 'JetBrains Mono',
  caretStyle: 'caret-line',
  soundEnabled: true,
  soundType: 'blue', // 'blue', 'brown', 'linear', 'beep'
  volume: 0.5,
  drillType: 'words', // 'words' | 'time'
  wordCount: 50,      // 25, 50, 100
  timeLimit: 30,      // 15, 30, 60, 120
  targetWpm: 80,
  activeMode: 'speed',     // 'speed' | 'accuracy' | 'code' | 'custom'
  activeSubMode: '100',   // for speed: '100'/'200'/'500'; for code: 'javascript'/'python'/'html_css'/'sql'/'bash'
  activeCustomId: null
};

export const Storage = {
  /**
   * Load user settings from localStorage
   */
  getSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn("Could not read settings from localStorage:", e);
    }
    return { ...DEFAULT_SETTINGS };
  },

  /**
   * Save user settings to localStorage
   */
  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn("Could not save settings to localStorage:", e);
    }
  },

  /**
   * Update partial settings
   */
  updateSettings(partial) {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    this.saveSettings(updated);
    return updated;
  },

  /**
   * Get saved custom snippets
   */
  getCustomSnippets() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SNIPPETS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load snippets from localStorage:", e);
    }
    return [...DEFAULT_CUSTOM_SNIPPETS];
  },

  /**
   * Save a new snippet or update existing
   */
  saveCustomSnippet(title, text, id = null) {
    const snippets = this.getCustomSnippets();
    if (id) {
      const idx = snippets.findIndex(s => s.id === id);
      if (idx !== -1) {
        snippets[idx] = { id, title, text, updatedAt: Date.now() };
      } else {
        snippets.push({ id, title, text, updatedAt: Date.now() });
      }
    } else {
      const newId = 'snip_' + Date.now();
      snippets.push({ id: newId, title, text, updatedAt: Date.now() });
    }
    try {
      localStorage.setItem(STORAGE_KEYS.SNIPPETS, JSON.stringify(snippets));
    } catch (e) {
      console.warn("Could not write snippets:", e);
    }
    return snippets;
  },

  /**
   * Delete snippet by id
   */
  deleteCustomSnippet(id) {
    const snippets = this.getCustomSnippets().filter(s => s.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.SNIPPETS, JSON.stringify(snippets));
    } catch (e) {
      console.warn("Could not delete snippet:", e);
    }
    return snippets;
  },

  /**
   * Save session performance score to history
   */
  saveSessionScore(scoreRecord) {
    try {
      const history = this.getSessionHistory();
      history.unshift({
        ...scoreRecord,
        timestamp: Date.now()
      });
      // Keep last 100 sessions
      const trimmed = history.slice(0, 100);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));

      // Update personal best
      const currentBest = this.getPersonalBest();
      if (!currentBest || scoreRecord.wpm > currentBest.wpm) {
        localStorage.setItem(STORAGE_KEYS.PERSONAL_BEST, JSON.stringify({
          wpm: scoreRecord.wpm,
          accuracy: scoreRecord.accuracy,
          mode: scoreRecord.mode,
          timestamp: Date.now()
        }));
      }
    } catch (e) {
      console.warn("Could not save session score:", e);
    }
  },

  /**
   * Get all session history
   */
  getSessionHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Could not load history:", e);
    }
    return [];
  },

  /**
   * Get personal best score record
   */
  getPersonalBest() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL_BEST);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Could not load personal best:", e);
    }
    return null;
  },

  /**
   * Sync a completed session to the Supabase `typing_sessions` table.
   * Only call this when a user is authenticated.
   * @returns {{ success: boolean, error?: string }}
   */
  async syncSessionToCloud(results, mode) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { error } = await supabase
        .from('typing_sessions')
        .insert({
          user_id:          user.id,
          mode:             mode || 'speed',
          wpm:              results.wpm,
          raw_cpm:          results.rawCpm,
          accuracy:         results.accuracy,
          errors:           results.errorKeystrokes,
          duration_seconds: parseFloat(results.timeSeconds)
        });

      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.warn('TypeVault: Cloud sync failed:', e.message);
      return { success: false, error: e.message };
    }
  },

  // ─── Goal Management & Duration Tracking ─────────────────────────────────

  /**
   * Load user goal settings from localStorage
   */
  getGoals() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Could not load goals from localStorage:', e);
    }
    return null;
  },

  /**
   * Save user goal settings to localStorage
   */
  saveGoals(goals) {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.warn('Could not save goals to localStorage:', e);
    }
  },

  /**
   * Get all duration logs by date { 'YYYY-MM-DD': totalSeconds }
   */
  getDurationLogs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DURATION_LOGS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Could not load duration logs:', e);
    }
    return {};
  },

  /**
   * Save duration logs to localStorage
   */
  saveDurationLogs(logs) {
    try {
      localStorage.setItem(STORAGE_KEYS.DURATION_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.warn('Could not save duration logs:', e);
    }
  },

  /**
   * Add practice duration in seconds for today's date
   */
  addPracticeDuration(seconds) {
    const logs = this.getDurationLogs();
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;

    logs[key] = (logs[key] || 0) + Math.round(seconds);
    this.saveDurationLogs(logs);
    return logs;
  },

  /**
   * Sync goals to Supabase if logged in
   */
  async syncGoalsToCloud(goals) {
    try {
      const res = await upsertUserGoals(goals);
      return res;
    } catch (e) {
      console.warn('TypeVault: syncGoalsToCloud error:', e);
      return { error: e };
    }
  },

  // ─── Character Error Analytics ──────────────────────────────────────────

  /**
   * Get cumulative character analytics: { [char]: { errors: number, total: number } }
   */
  getCharacterAnalytics() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHAR_ANALYTICS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Could not load character analytics:', e);
    }
    return {};
  },

  /**
   * Save cumulative character analytics to localStorage
   */
  saveCharacterAnalytics(data) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAR_ANALYTICS, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save character analytics:', e);
    }
  },

  /**
   * Record errors and attempts from a completed session
   */
  recordCharacterStats(errorLog = {}, charStats = {}) {
    const cumulative = this.getCharacterAnalytics();

    // Incorporate detailed keystroke stats if available
    Object.keys(charStats).forEach(key => {
      if (!cumulative[key]) {
        cumulative[key] = { errors: 0, total: 0 };
      }
      cumulative[key].total += (charStats[key].total || 0);
      cumulative[key].errors += (charStats[key].errors || 0);
    });

    // Also ensure any keys from errorLog are accounted for
    Object.keys(errorLog).forEach(key => {
      if (!cumulative[key]) {
        cumulative[key] = { errors: 0, total: errorLog[key] };
      } else if (!charStats[key]) {
        cumulative[key].errors += errorLog[key];
        cumulative[key].total = Math.max(cumulative[key].total, cumulative[key].errors);
      }
    });

    this.saveCharacterAnalytics(cumulative);

    // Sync to cloud asynchronously if authenticated
    this.syncCharacterAnalyticsToCloud(cumulative);

    return cumulative;
  },

  /**
   * Sync character analytics to Supabase
   */
  async syncCharacterAnalyticsToCloud(charData) {
    try {
      const res = await upsertCharacterAnalytics(charData);
      return res;
    } catch (e) {
      console.warn('TypeVault: syncCharacterAnalyticsToCloud error:', e);
      return { error: e };
    }
  },

  /**
   * Pull cloud goals and character analytics on user login
   */
  async fetchCloudGoalsAndAnalytics() {
    try {
      const goalsRes = await getUserGoals();
      if (goalsRes?.data) {
        const cloudGoals = {
          dailyMinutes: goalsRes.data.daily_minutes,
          weeklyMinutes: goalsRes.data.weekly_minutes,
          monthlyMinutes: goalsRes.data.monthly_minutes,
          targetWpmSpeed: goalsRes.data.target_wpm_speed,
          targetWpmAccuracy: goalsRes.data.target_wpm_accuracy,
          targetWpmCode: goalsRes.data.target_wpm_code,
          targetAccuracy: goalsRes.data.target_accuracy
        };
        this.saveGoals(cloudGoals);
      }

      const charRes = await getCharacterAnalytics();
      if (charRes?.data?.analytics_data) {
        this.saveCharacterAnalytics(charRes.data.analytics_data);
      }
    } catch (e) {
      console.warn('TypeVault: fetchCloudGoalsAndAnalytics failed:', e);
    }
  }
};

