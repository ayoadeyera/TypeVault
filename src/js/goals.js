/* ==========================================================================
   TypeVault - Real-Time Goal Tracking Engine
   Tracks duration goals across Daily, Weekly, and Monthly windows,
   calculates percentage completion, and maintains mode WPM benchmarks.
   ========================================================================== */

import { Storage } from './storage.js';

export const DEFAULT_GOALS = {
  dailyMinutes: 15,
  weeklyMinutes: 75,
  monthlyMinutes: 300,
  targetWpmSpeed: 80,
  targetWpmAccuracy: 60,
  targetWpmCode: 50,
  targetAccuracy: 96
};

export class GoalsManager {
  constructor() {
    this.refresh();
  }

  /**
   * Reload goals and logs from storage
   */
  refresh() {
    this.goals = Storage.getGoals() || { ...DEFAULT_GOALS };
    this.durationLogs = Storage.getDurationLogs() || {};
  }

  /**
   * Get current goal settings
   */
  getSettings() {
    return { ...DEFAULT_GOALS, ...(this.goals || {}) };
  }

  /**
   * Update and persist goal settings
   */
  async updateSettings(newSettings) {
    this.goals = {
      ...this.goals,
      ...newSettings
    };
    Storage.saveGoals(this.goals);

    // Sync to Supabase if logged in
    await Storage.syncGoalsToCloud(this.goals);
    return this.goals;
  }

  /**
   * Returns date key formatted as YYYY-MM-DD
   */
  getDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Record practice seconds for a completed drill
   */
  async recordDrillDuration(seconds) {
    if (!seconds || seconds <= 0) return;
    this.durationLogs = Storage.addPracticeDuration(seconds);
    this.refresh();
  }

  /**
   * Get accumulated seconds for today
   */
  getTodaySeconds() {
    const todayKey = this.getDateKey();
    return this.durationLogs[todayKey] || 0;
  }

  /**
   * Get accumulated seconds over the past N days (including today)
   */
  getRecentSeconds(days = 7) {
    let totalSeconds = 0;
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = this.getDateKey(d);
      totalSeconds += (this.durationLogs[key] || 0);
    }
    return totalSeconds;
  }

  /**
   * Real-time calculation for Daily Duration Goal
   * @param {number} liveDrillSeconds - ongoing seconds during the current active drill
   */
  getDailyProgress(liveDrillSeconds = 0) {
    const settings = this.getSettings();
    const todaySec = this.getTodaySeconds() + liveDrillSeconds;
    const currentMins = todaySec / 60;
    const targetMins = Number(settings.dailyMinutes) || DEFAULT_GOALS.dailyMinutes;
    const percent = Math.min(100, Math.round((currentMins / targetMins) * 100));

    return {
      currentSeconds: todaySec,
      currentMinutes: Number(currentMins.toFixed(1)),
      targetMinutes: targetMins,
      percent,
      isCompleted: currentMins >= targetMins
    };
  }

  /**
   * Calculation for Weekly Duration Goal (past 7 days)
   * @param {number} liveDrillSeconds
   */
  getWeeklyProgress(liveDrillSeconds = 0) {
    const settings = this.getSettings();
    const weekSec = this.getRecentSeconds(7) + liveDrillSeconds;
    const currentMins = weekSec / 60;
    const targetMins = Number(settings.weeklyMinutes) || DEFAULT_GOALS.weeklyMinutes;
    const percent = Math.min(100, Math.round((currentMins / targetMins) * 100));

    return {
      currentSeconds: weekSec,
      currentMinutes: Number(currentMins.toFixed(1)),
      targetMinutes: targetMins,
      percent,
      isCompleted: currentMins >= targetMins
    };
  }

  /**
   * Calculation for Monthly Duration Goal (past 30 days)
   * @param {number} liveDrillSeconds
   */
  getMonthlyProgress(liveDrillSeconds = 0) {
    const settings = this.getSettings();
    const monthSec = this.getRecentSeconds(30) + liveDrillSeconds;
    const currentMins = monthSec / 60;
    const targetMins = Number(settings.monthlyMinutes) || DEFAULT_GOALS.monthlyMinutes;
    const percent = Math.min(100, Math.round((currentMins / targetMins) * 100));

    return {
      currentSeconds: monthSec,
      currentMinutes: Number(currentMins.toFixed(1)),
      targetMinutes: targetMins,
      percent,
      isCompleted: currentMins >= targetMins
    };
  }

  /**
   * Get target WPM benchmark for a given drill mode
   */
  getTargetWpmForMode(mode = 'speed') {
    const g = this.getSettings();
    switch (mode) {
      case 'accuracy':
        return g.targetWpmAccuracy;
      case 'code':
        return g.targetWpmCode;
      case 'speed':
      default:
        return g.targetWpmSpeed;
    }
  }
}
