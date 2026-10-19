/* ==========================================================================
   Type Station - Local & Cloud Storage Manager
   A Product of PluralTech LTD
   ========================================================================== */

import { DEFAULT_CUSTOM_SNIPPETS } from './modes.js';

const STORAGE_KEYS = {
  SETTINGS: 'typestation_settings',
  SNIPPETS: 'typestation_custom_snippets',
  HISTORY: 'typestation_session_history',
  PERSONAL_BEST: 'typestation_personal_best',
  GOALS: 'typestation_user_goals',
  DURATION_LOGS: 'typestation_duration_logs',
  CHAR_ANALYTICS: 'typestation_character_analytics'
};

const DEFAULT_SETTINGS = {
  theme: 'dark',
  font: 'JetBrains Mono',
  caretStyle: 'caret-line',
  soundEnabled: true,
  soundType: 'blue',
  volume: 0.5,
  drillType: 'words',
  wordCount: 50,
  timeLimit: 30,
  targetWpm: 80,
  activeMode: 'speed',
  activeSubMode: '100',
  activeCustomId: null
};

export const Storage = {
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

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn("Could not save settings to localStorage:", e);
    }
  },

  updateSettings(partial) {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    this.saveSettings(updated);
    return updated;
  },

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
      snippets.unshift({ id: newId, title, text, updatedAt: Date.now() });
    }

    try {
      localStorage.setItem(STORAGE_KEYS.SNIPPETS, JSON.stringify(snippets));
    } catch (e) {
      console.warn("Could not save custom snippets:", e);
    }
    return snippets;
  },

  deleteCustomSnippet(id) {
    let snippets = this.getCustomSnippets();
    snippets = snippets.filter(s => s.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.SNIPPETS, JSON.stringify(snippets));
    } catch (e) {
      console.warn("Could not delete custom snippet:", e);
    }
    return snippets;
  },

  saveSessionResults(results) {
    const history = this.getSessionHistory();
    const sessionRecord = {
      id: 'sess_' + Date.now(),
      timestamp: Date.now(),
      ...results
    };
    history.unshift(sessionRecord);

    const trimmedHistory = history.slice(0, 100);
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmedHistory));
    } catch (e) {
      console.warn("Could not save session history:", e);
    }

    this.checkAndUpdatePB(results);

    // Sync to PostgreSQL backend if user is authenticated
    this.syncSessionToCloud(results);

    return sessionRecord;
  },

  getSessionHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Could not load history from localStorage:", e);
    }
    return [];
  },

  getPersonalBest(mode, subMode) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PERSONAL_BEST);
      if (stored) {
        const pbs = JSON.parse(stored);
        const key = `${mode}_${subMode}`;
        return pbs[key] || null;
      }
    } catch (e) {
      console.warn("Could not load personal bests:", e);
    }
    return null;
  },

  checkAndUpdatePB(results) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PERSONAL_BEST);
      const pbs = stored ? JSON.parse(stored) : {};
      const key = `${results.mode}_${results.drillType}`;
      const currentPB = pbs[key];

      if (!currentPB || results.wpm > currentPB.wpm) {
        pbs[key] = {
          wpm: results.wpm,
          accuracy: results.accuracy,
          date: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.PERSONAL_BEST, JSON.stringify(pbs));
        return true;
      }
    } catch (e) {
      console.warn("Could not update personal best:", e);
    }
    return false;
  },

  async syncSessionToCloud(results) {
    try {
      const res = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: results.mode || 'speed',
          subMode: results.drillType || 'words',
          wpm: parseFloat(results.wpm) || 0,
          rawWpm: parseFloat(results.rawWpm) || 0,
          accuracy: parseFloat(results.accuracy) || 0,
          consistency: parseFloat(results.consistency) || 0,
          timeSeconds: parseFloat(results.timeSeconds) || 0,
          errorCount: parseInt(results.errorKeystrokes || 0, 10),
          charBreakdown: results.errorLog || {}
        })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  getGoals() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Could not load goals from localStorage:', e);
    }
    return null;
  },

  saveGoals(goals) {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.warn('Could not save goals to localStorage:', e);
    }
  },

  getDurationLogs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DURATION_LOGS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Could not load duration logs:', e);
    }
    return {};
  },

  saveDurationLogs(logs) {
    try {
      localStorage.setItem(STORAGE_KEYS.DURATION_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.warn('Could not save duration logs:', e);
    }
  },

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

  async syncGoalsToCloud(goals) {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goals)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  getCharacterAnalytics() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHAR_ANALYTICS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Could not load character analytics:', e);
    }
    return {};
  },

  saveCharacterAnalytics(data) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAR_ANALYTICS, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save character analytics:', e);
    }
  },

  recordCharacterStats(errorLog = {}, charStats = {}) {
    const cumulative = this.getCharacterAnalytics();

    Object.keys(charStats).forEach(key => {
      if (!cumulative[key]) {
        cumulative[key] = { errors: 0, total: 0 };
      }
      cumulative[key].total += (charStats[key].total || 0);
      cumulative[key].errors += (charStats[key].errors || 0);
    });

    Object.keys(errorLog).forEach(key => {
      if (!cumulative[key]) {
        cumulative[key] = { errors: 0, total: errorLog[key] };
      } else if (!charStats[key]) {
        cumulative[key].errors += errorLog[key];
        cumulative[key].total = Math.max(cumulative[key].total, cumulative[key].errors);
      }
    });

    this.saveCharacterAnalytics(cumulative);
    this.syncCharacterAnalyticsToCloud(cumulative);
    return cumulative;
  },

  async syncCharacterAnalyticsToCloud(charData) {
    try {
      const res = await fetch('/api/analytics/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analytics: charData })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async fetchCloudGoalsAndAnalytics() {
    try {
      const goalsRes = await fetch('/api/goals');
      if (goalsRes.ok) {
        const goalsJson = await goalsRes.json();
        if (goalsJson?.goals) {
          this.saveGoals(goalsJson.goals);
        }
      }

      const charRes = await fetch('/api/analytics/characters');
      if (charRes.ok) {
        const charJson = await charRes.json();
        if (charJson?.analytics) {
          this.saveCharacterAnalytics(charJson.analytics);
        }
      }
    } catch (e) {
      // offline or not logged in
    }
  }
};
