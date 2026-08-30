/* ==========================================================================
   TypeVault - Local Storage Manager
   ========================================================================== */

import { DEFAULT_CUSTOM_SNIPPETS } from './modes.js';

const STORAGE_KEYS = {
  SETTINGS: 'typevault_settings',
  SNIPPETS: 'typevault_custom_snippets',
  HISTORY: 'typevault_session_history',
  PERSONAL_BEST: 'typevault_personal_best'
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
  }
};
