/* ==========================================================================
   Type Station - Real-Time Analytics & SVG Performance Chart Generator
   A Product of PluralTech LTD
   ========================================================================== */

import { Storage } from './storage.js';

export class AnalyticsTracker {
  constructor() {
    this.reset();
  }

  reset() {
    this.startTime = null;
    this.endTime = null;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.errorKeystrokes = 0;
    this.extraCharacters = 0;
    this.missedCharacters = 0;
    this.samples = []; // array of { timeSec, wpm, rawWpm, errors }
    this.lastSampleSecond = 0;
    this.errorLog = {}; // character -> error count
    this.charStats = {}; // character -> { errors, total }
  }

  start() {
    this.reset();
    this.startTime = Date.now();
  }

  recordKeystroke(isCorrect, expectedChar, typedChar) {
    if (!this.startTime) {
      this.start();
    }
    this.totalKeystrokes++;

    const key = expectedChar || typedChar || 'unknown';

    if (!this.charStats[key]) {
      this.charStats[key] = { errors: 0, total: 0 };
    }
    this.charStats[key].total++;

    if (isCorrect) {
      this.correctKeystrokes++;
    } else {
      this.errorKeystrokes++;
      this.charStats[key].errors++;
      this.errorLog[key] = (this.errorLog[key] || 0) + 1;
    }
  }

  recordExtra() {
    this.extraCharacters++;
    this.totalKeystrokes++;
    this.errorKeystrokes++;
  }

  takeSample(correctCharsSoFar, totalTypedSoFar) {
    if (!this.startTime) return;
    const elapsedSec = (Date.now() - this.startTime) / 1000;
    const currentSec = Math.floor(elapsedSec);

    if (currentSec > this.lastSampleSecond && currentSec > 0) {
      const minutes = elapsedSec / 60;
      const wpm = minutes > 0 ? Math.round((correctCharsSoFar / 5) / minutes) : 0;
      const rawWpm = minutes > 0 ? Math.round((totalTypedSoFar / 5) / minutes) : 0;

      this.samples.push({
        timeSec: currentSec,
        wpm: Math.max(0, wpm),
        rawWpm: Math.max(0, rawWpm),
        errors: this.errorKeystrokes
      });
      this.lastSampleSecond = currentSec;
    }
  }

  finalize(correctChars, totalTyped, totalTargetChars) {
    this.endTime = Date.now();
    const elapsedMs = Math.max(500, this.endTime - this.startTime);
    const elapsedMinutes = elapsedMs / (1000 * 60);

    const netWpm = Math.max(0, Math.round((correctChars / 5) / elapsedMinutes));
    const rawWpm = Math.max(0, Math.round((totalTyped / 5) / elapsedMinutes));
    const rawCpm = Math.max(0, Math.round(totalTyped / elapsedMinutes));

    const accuracy = this.totalKeystrokes > 0
      ? Math.max(0, Math.min(100, Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100)))
      : 100;

    this.missedCharacters = Math.max(0, totalTargetChars - correctChars);

    // Consistency score (0-100%) based on variance of samples
    let consistency = 100;
    if (this.samples.length > 2) {
      const wpms = this.samples.map(s => s.wpm);
      const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
      const variance = wpms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpms.length;
      const stdDev = Math.sqrt(variance);
      const cv = mean > 0 ? (stdDev / mean) : 0;
      consistency = Math.max(10, Math.min(100, Math.round(100 - (cv * 60))));
    }

    if (this.samples.length === 0) {
      this.samples.push({
        timeSec: Math.round(elapsedMs / 1000) || 1,
        wpm: netWpm,
        rawWpm: rawWpm,
        errors: this.errorKeystrokes
      });
    }

    return {
      wpm: netWpm,
      rawWpm,
      rawCpm,
      accuracy,
      consistency,
      timeSeconds: (elapsedMs / 1000).toFixed(1),
      totalKeystrokes: this.totalKeystrokes,
      correctKeystrokes: this.correctKeystrokes,
      errorKeystrokes: this.errorKeystrokes,
      extraCharacters: this.extraCharacters,
      missedCharacters: this.missedCharacters,
      samples: this.samples,
      errorLog: this.errorLog,
      charStats: this.charStats
    };
  }

  /**
   * Render an interactive SVG sparkline/area chart for session results
   */
  static renderSvgChart(samples, containerElement) {
    if (!containerElement || !samples || samples.length === 0) return;

    const width = 680;
    const height = 150;
    const padding = { top: 20, right: 30, bottom: 25, left: 35 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxTime = Math.max(...samples.map(s => s.timeSec), 1);
    const maxWpm = Math.max(...samples.map(s => Math.max(s.wpm, s.rawWpm)), 40) + 10;
    const minWpm = 0;

    const getX = (timeSec) => padding.left + (timeSec / maxTime) * chartW;
    const getY = (wpm) => padding.top + chartH - ((wpm - minWpm) / (maxWpm - minWpm)) * chartH;

    const netPoints = samples.map(s => `${getX(s.timeSec)},${getY(s.wpm)}`);
    const rawPoints = samples.map(s => `${getX(s.timeSec)},${getY(s.rawWpm)}`);

    const netPathD = `M ${netPoints.join(' L ')}`;
    const rawPathD = `M ${rawPoints.join(' L ')}`;

    const areaD = `M ${getX(samples[0].timeSec)},${getY(0)} ` +
                  `L ${netPoints.join(' L ')} ` +
                  `L ${getX(samples[samples.length - 1].timeSec)},${getY(0)} Z`;

    const gridLines = [0, Math.round(maxWpm / 2), maxWpm].map(val => {
      const y = getY(val);
      return `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--border-subtle)" stroke-dasharray="3 3" />
        <text x="${padding.left - 8}" y="${y + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end" font-family="var(--font-mono)">${val}</text>
      `;
    }).join('');

    let prevErrors = 0;
    const errorDots = samples.map(s => {
      const isNewError = s.errors > prevErrors;
      prevErrors = s.errors;
      if (isNewError) {
        return `<circle cx="${getX(s.timeSec)}" cy="${getY(s.wpm)}" r="4" fill="var(--color-incorrect)" stroke="var(--bg-secondary)" stroke-width="1.5" />`;
      }
      return '';
    }).join('');

    const svgHtml = `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" class="session-svg-chart">
        <defs>
          <linearGradient id="wpmGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.35" />
            <stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Grid Lines -->
        ${gridLines}

        <!-- X-Axis Labels -->
        <text x="${padding.left}" y="${height - 6}" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)">0s</text>
        <text x="${width - padding.right}" y="${height - 6}" fill="var(--text-muted)" font-size="10" text-anchor="end" font-family="var(--font-mono)">${maxTime}s</text>

        <!-- Fill Area -->
        <path d="${areaD}" fill="url(#wpmGradient)" />

        <!-- Raw WPM Line (Dashed) -->
        <path d="${rawPathD}" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.7" />

        <!-- Net WPM Line -->
        <path d="${netPathD}" fill="none" stroke="var(--color-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Dots on Net WPM -->
        ${samples.map(s => `<circle cx="${getX(s.timeSec)}" cy="${getY(s.wpm)}" r="3" fill="var(--color-accent)" />`).join('')}

        <!-- Error Indicators -->
        ${errorDots}
      </svg>
    `;

    containerElement.innerHTML = svgHtml;
  }
}

/* ==========================================================================
   Type Station - Diagnostic & Weak-Spot Analyzer Engine
   Analyzes persistent keystroke metrics, identifies weakest keys,
   detects accuracy drops by mode, and outputs actionable coaching tips.
   ========================================================================== */

export class DiagnosticsEngine {
  static formatKeyLabel(key) {
    if (key === ' ') return 'Space';
    if (key === '\n') return 'Enter';
    if (key === '\t') return 'Tab';
    return key;
  }

  static getTopWeakestKeys(limit = 3) {
    const cumulative = Storage.getCharacterAnalytics();
    const keysArray = [];

    Object.keys(cumulative).forEach(key => {
      const stats = cumulative[key];
      const errors = stats.errors || 0;
      const total = stats.total || errors;

      if (errors > 0) {
        const errorRate = total > 0 ? Math.round((errors / total) * 100) : 100;
        const accuracy = Math.max(0, 100 - errorRate);
        keysArray.push({
          key,
          label: this.formatKeyLabel(key),
          errors,
          total,
          errorRate,
          accuracy
        });
      }
    });

    if (keysArray.length === 0) {
      const history = Storage.getSessionHistory();
      const tempMap = {};

      history.forEach(session => {
        if (session.errorLog) {
          Object.keys(session.errorLog).forEach(k => {
            const errs = session.errorLog[k] || 0;
            if (!tempMap[k]) tempMap[k] = { errors: 0, total: 0 };
            tempMap[k].errors += errs;
            tempMap[k].total += errs * 2;
          });
        }
      });

      Object.keys(tempMap).forEach(k => {
        const errors = tempMap[k].errors;
        const total = tempMap[k].total;
        keysArray.push({
          key: k,
          label: this.formatKeyLabel(k),
          errors,
          total,
          errorRate: Math.round((errors / Math.max(1, total)) * 100),
          accuracy: Math.max(0, 100 - Math.round((errors / Math.max(1, total)) * 100))
        });
      });
    }

    keysArray.sort((a, b) => b.errors - a.errors || b.errorRate - a.errorRate);

    if (keysArray.length > 0) {
      return keysArray.slice(0, limit);
    }

    return [
      { key: '[', label: '[', errors: 0, total: 0, errorRate: 0, accuracy: 100, isBaseline: true },
      { key: ']', label: ']', errors: 0, total: 0, errorRate: 0, accuracy: 100, isBaseline: true },
      { key: '_', label: '_', errors: 0, total: 0, errorRate: 0, accuracy: 100, isBaseline: true }
    ];
  }

  static getModeAccuracyAnalysis() {
    const history = Storage.getSessionHistory();
    const modes = {
      speed: { count: 0, totalAcc: 0, totalWpm: 0 },
      accuracy: { count: 0, totalAcc: 0, totalWpm: 0 },
      code: { count: 0, totalAcc: 0, totalWpm: 0 }
    };

    history.forEach(session => {
      const m = session.mode || 'speed';
      if (modes[m]) {
        modes[m].count++;
        modes[m].totalAcc += (session.accuracy || 0);
        modes[m].totalWpm += (session.wpm || 0);
      }
    });

    const getAvg = (item) => ({
      count: item.count,
      avgAcc: item.count > 0 ? Math.round(item.totalAcc / item.count) : null,
      avgWpm: item.count > 0 ? Math.round(item.totalWpm / item.count) : null
    });

    const speedStats = getAvg(modes.speed);
    const accuracyStats = getAvg(modes.accuracy);
    const codeStats = getAvg(modes.code);

    let comparisonText = 'Complete drills across multiple modes to reveal comparative precision trends.';
    let dropPercent = 0;
    let hasDrop = false;

    if (codeStats.avgAcc !== null && speedStats.avgAcc !== null) {
      const diff = speedStats.avgAcc - codeStats.avgAcc;
      if (diff > 0) {
        dropPercent = diff;
        hasDrop = true;
        comparisonText = `Code accuracy is ${diff}% lower than Speed mode.`;
      } else if (diff < 0) {
        comparisonText = `Code accuracy is ${Math.abs(diff)}% higher than Speed mode!`;
      } else {
        comparisonText = `Code and Speed mode accuracy are matched at ${speedStats.avgAcc}%.`;
      }
    } else if (accuracyStats.avgAcc !== null && speedStats.avgAcc !== null) {
      const diff = speedStats.avgAcc - accuracyStats.avgAcc;
      if (diff > 0) {
        dropPercent = diff;
        hasDrop = true;
        comparisonText = `Accuracy/Symbols mode is ${diff}% lower than Speed mode.`;
      } else {
        comparisonText = `Accuracy/Symbols precision averages ${accuracyStats.avgAcc}%.`;
      }
    }

    return {
      speed: speedStats,
      accuracy: accuracyStats,
      code: codeStats,
      dropPercent,
      hasDrop,
      comparisonText
    };
  }

  static generateRecommendations() {
    const weakKeys = this.getTopWeakestKeys(3);
    const modeAnalysis = this.getModeAccuracyAnalysis();
    const goals = Storage.getGoals() || {};
    const cards = [];

    const topKey = weakKeys[0]?.key;
    let ergonomicTip = 'Focus on maintaining anchor fingers on the home row (F & J) to minimize wrist strain.';

    if (topKey) {
      if (['[', ']', '{', '}'].includes(topKey)) {
        ergonomicTip = 'Focus on right-pinky reach for brackets. Keep your index finger anchored on "J" to preserve spatial awareness without twisting your wrist.';
      } else if (['_', '-', '=', '+'].includes(topKey)) {
        ergonomicTip = 'Reach up to the top symbol row using your pinky and ring fingers while keeping your palm hovering rather than anchored flat.';
      } else if ([';', ':', "'", '"'].includes(topKey)) {
        ergonomicTip = 'Keep your right hand relaxed on the home row; strike punctuation with a light, swift tap rather than pressing hard.';
      } else if (['(', ')'].includes(topKey)) {
        ergonomicTip = 'Coordinate your left pinky for Shift while striking top-row parentheses with your right hand for fluid coding flow.';
      } else if (['q', 'a', 'z'].includes(topKey)) {
        ergonomicTip = 'Strengthen left-pinky dexterity on the outer column reach without rotating your forearm inward.';
      } else if (['p', '/', '\\'].includes(topKey)) {
        ergonomicTip = 'Extend your right pinky smoothly for outer reaches without lifting your entire hand off the desk.';
      } else if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(topKey)) {
        ergonomicTip = 'Practice number row muscle memory with minimal hand lifting to avoid breaking typing velocity.';
      } else if (topKey === 'Shift' || topKey.length === 1 && topKey === topKey.toUpperCase() && topKey !== topKey.toLowerCase()) {
        ergonomicTip = 'Use the opposite hand\'s Shift key when typing capital letters to prevent finger hitching and cramping.';
      }
    }

    cards.push({
      type: 'ergonomic',
      title: 'Ergonomic Reach & Weak-Key Tip',
      icon: '🖐️',
      badge: topKey ? `Key: ${DiagnosticsEngine.formatKeyLabel(topKey)}` : 'Technique',
      text: ergonomicTip
    });

    if (modeAnalysis.hasDrop) {
      cards.push({
        type: 'mode-drop',
        title: 'Mode Accuracy Disparity',
        icon: '⚠️',
        badge: `-${modeAnalysis.dropPercent}% Drop`,
        text: `${modeAnalysis.comparisonText} Syntax symbols and code indentation require deliberate pacing. Slow down slightly during code blocks to allow finger transitions to settle.`
      });
    } else {
      cards.push({
        type: 'mode-balance',
        title: 'Cross-Mode Precision',
        icon: '🎯',
        badge: 'Balanced',
        text: modeAnalysis.comparisonText || 'Maintain high accuracy across all drill modes to build robust developer muscle memory.'
      });
    }

    const targetWpm = goals.targetWpmSpeed || 80;
    const history = Storage.getSessionHistory();
    const recentWpm = history.length > 0 ? history[0].wpm : 0;
    const diffToGoal = targetWpm - recentWpm;

    let benchmarkMsg = `Target benchmark is ${targetWpm} WPM.`;
    if (diffToGoal > 0) {
      benchmarkMsg += ` You are ${diffToGoal} WPM away from your speed target. Focus on rhythm and eliminating pauses before pushing speed.`;
    } else {
      benchmarkMsg += ` Great job! You achieved or exceeded your target WPM (${recentWpm} WPM). Consider raising your benchmark!`;
    }

    cards.push({
      type: 'benchmark',
      title: 'Target Benchmark & Pacing',
      icon: '⚡',
      badge: `${targetWpm} WPM Target`,
      text: benchmarkMsg
    });

    return cards;
  }
}
