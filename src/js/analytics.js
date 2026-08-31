/* ==========================================================================
   TypeVault - Real-Time Analytics & SVG Performance Chart Generator
   ========================================================================== */

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
    if (isCorrect) {
      this.correctKeystrokes++;
    } else {
      this.errorKeystrokes++;
      const key = expectedChar || typedChar || 'unknown';
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

    // Ensure at least 1 sample exists for chart
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
      errorLog: this.errorLog
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

    // Generate Points
    const netPoints = samples.map(s => `${getX(s.timeSec)},${getY(s.wpm)}`);
    const rawPoints = samples.map(s => `${getX(s.timeSec)},${getY(s.rawWpm)}`);

    const netPathD = `M ${netPoints.join(' L ')}`;
    const rawPathD = `M ${rawPoints.join(' L ')}`;

    // Fill area under net WPM curve
    const areaD = `M ${getX(samples[0].timeSec)},${getY(0)} ` +
                  `L ${netPoints.join(' L ')} ` +
                  `L ${getX(samples[samples.length - 1].timeSec)},${getY(0)} Z`;

    // Horizontal grid lines
    const gridLines = [0, Math.round(maxWpm / 2), maxWpm].map(val => {
      const y = getY(val);
      return `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--border-subtle)" stroke-dasharray="3 3" />
        <text x="${padding.left - 8}" y="${y + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end" font-family="var(--font-mono)">${val}</text>
      `;
    }).join('');

    // Error points
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
