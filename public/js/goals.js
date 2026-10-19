/* ==========================================================================
   Type Station - Real-Time Goal Tracking Engine
   A Product of PluralTech LTD
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

  refresh() {
    this.goals = Storage.getGoals() || { ...DEFAULT_GOALS };
    this.durationLogs = Storage.getDurationLogs() || {};
  }

  getSettings() {
    return { ...DEFAULT_GOALS, ...(this.goals || {}) };
  }

  async updateSettings(newSettings) {
    this.goals = {
      ...this.goals,
      ...newSettings
    };
    Storage.saveGoals(this.goals);

    // Sync to backend if logged in
    await Storage.syncGoalsToCloud(this.goals);
    return this.goals;
  }

  getDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  async recordDrillDuration(seconds) {
    if (!seconds || seconds <= 0) return;
    this.durationLogs = Storage.addPracticeDuration(seconds);
    this.refresh();
  }

  getTodaySeconds() {
    const todayKey = this.getDateKey();
    return this.durationLogs[todayKey] || 0;
  }

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
