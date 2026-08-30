/* ==========================================================================
   TypeVault - Core Typing Engine
   ========================================================================== */

import { AnalyticsTracker } from './analytics.js';
import { Sound } from './sound.js';

export class TypingEngine {
  constructor(options = {}) {
    this.arenaElement = options.arenaElement;
    this.wordsContainer = options.wordsContainer;
    this.caretElement = options.caretElement;
    this.hiddenInput = options.hiddenInput;
    this.onTick = options.onTick || (() => {});
    this.onComplete = options.onComplete || (() => {});

    this.analytics = new AnalyticsTracker();
    this.targetText = "";
    this.mode = "speed"; // "speed" | "accuracy" | "code" | "custom"
    this.drillType = "words"; // "words" | "time"
    this.timeLimit = 30; // seconds
    this.wordCount = 50;

    this.isRunning = false;
    this.isCompleted = false;
    this.timerInterval = null;
    this.timeRemaining = 30;
    this.timeElapsed = 0;

    // Internal state
    this.charElements = []; // Array of { element, expectedChar, status, isNewline, isSpace, wordIndex }
    this.activeCharIndex = 0;
    this.totalChars = 0;
    this.totalTyped = 0;
    this.correctChars = 0;

    this.bindEvents();
  }

  bindEvents() {
    if (!this.hiddenInput) return;

    // Focus handling
    this.hiddenInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.hiddenInput.addEventListener('input', (e) => this.handleInput(e));

    this.arenaElement.addEventListener('click', () => {
      this.focus();
    });

    this.hiddenInput.addEventListener('focus', () => {
      this.arenaElement.classList.add('is-focused');
      this.arenaElement.classList.remove('is-blurred');
    });

    this.hiddenInput.addEventListener('blur', () => {
      this.arenaElement.classList.remove('is-focused');
      this.arenaElement.classList.add('is-blurred');
    });

    window.addEventListener('resize', () => {
      this.updateCaretPosition();
    });
  }

  focus() {
    if (this.hiddenInput) {
      this.hiddenInput.focus();
      this.arenaElement.classList.add('is-focused');
      this.arenaElement.classList.remove('is-blurred');
    }
  }

  loadDrill(targetText, mode, drillType, durationOrCount) {
    this.reset();
    this.targetText = targetText;
    this.mode = mode;
    this.drillType = drillType;
    if (drillType === 'time') {
      this.timeLimit = durationOrCount;
      this.timeRemaining = durationOrCount;
    } else {
      this.wordCount = durationOrCount;
    }

    this.renderText();
    this.updateCaretPosition();
  }

  reset() {
    this.stopTimer();
    this.isRunning = false;
    this.isCompleted = false;
    this.activeCharIndex = 0;
    this.totalChars = 0;
    this.totalTyped = 0;
    this.correctChars = 0;
    this.timeElapsed = 0;
    this.timeRemaining = this.drillType === 'time' ? this.timeLimit : 0;
    this.charElements = [];
    this.analytics.reset();
    if (this.hiddenInput) this.hiddenInput.value = "";
    if (this.wordsContainer) {
      this.wordsContainer.style.transform = 'translateY(0px)';
    }
  }

  renderText() {
    if (!this.wordsContainer) return;
    this.wordsContainer.innerHTML = "";
    this.charElements = [];

    const isCodeMode = this.mode === 'code' || this.targetText.includes('\n');
    if (isCodeMode) {
      this.wordsContainer.classList.add('is-code');
      this.renderCodeMode();
    } else {
      this.wordsContainer.classList.remove('is-code');
      this.renderStandardMode();
    }

    this.totalChars = this.charElements.length;
  }

  renderStandardMode() {
    const rawWords = this.targetText.trim().split(/\s+/);
    let globalIndex = 0;

    rawWords.forEach((wordText, wIdx) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';
      wordSpan.dataset.wordIndex = wIdx;

      // Characters in word
      for (let i = 0; i < wordText.length; i++) {
        const char = wordText[i];
        const charSpan = document.createElement('span');
        charSpan.className = 'char untyped';
        charSpan.textContent = char;
        charSpan.dataset.index = globalIndex;
        wordSpan.appendChild(charSpan);

        this.charElements.push({
          element: charSpan,
          expectedChar: char,
          status: 'untyped',
          isNewline: false,
          isSpace: false,
          wordIndex: wIdx,
          parentWord: wordSpan
        });
        globalIndex++;
      }

      // Trailing space (except last word)
      if (wIdx < rawWords.length - 1) {
        const spaceSpan = document.createElement('span');
        spaceSpan.className = 'char untyped space-marker';
        spaceSpan.textContent = ' ';
        spaceSpan.dataset.index = globalIndex;
        wordSpan.appendChild(spaceSpan);

        this.charElements.push({
          element: spaceSpan,
          expectedChar: ' ',
          status: 'untyped',
          isNewline: false,
          isSpace: true,
          wordIndex: wIdx,
          parentWord: wordSpan
        });
        globalIndex++;
      }

      this.wordsContainer.appendChild(wordSpan);
    });
  }

  renderCodeMode() {
    const lines = this.targetText.split('\n');
    let globalIndex = 0;

    lines.forEach((lineText, lineIdx) => {
      const lineDiv = document.createElement('div');
      lineDiv.className = 'code-line' + (lineIdx === 0 ? ' is-active' : '');
      lineDiv.dataset.lineIndex = lineIdx;

      const lineNum = document.createElement('div');
      lineNum.className = 'code-line-number';
      lineNum.textContent = lineIdx + 1;
      lineDiv.appendChild(lineNum);

      const lineContent = document.createElement('div');
      lineContent.className = 'code-line-content';

      for (let i = 0; i < lineText.length; i++) {
        const char = lineText[i];
        const charSpan = document.createElement('span');
        charSpan.className = 'char untyped' + (char === ' ' ? ' space-marker' : '');
        charSpan.textContent = char;
        charSpan.dataset.index = globalIndex;
        lineContent.appendChild(charSpan);

        this.charElements.push({
          element: charSpan,
          expectedChar: char,
          status: 'untyped',
          isNewline: false,
          isSpace: char === ' ',
          lineIndex: lineIdx,
          parentLine: lineDiv
        });
        globalIndex++;
      }

      // Newline char at end of line (except last line)
      if (lineIdx < lines.length - 1) {
        const nlSpan = document.createElement('span');
        nlSpan.className = 'char untyped newline-symbol';
        nlSpan.textContent = '↵';
        nlSpan.dataset.index = globalIndex;
        lineContent.appendChild(nlSpan);

        this.charElements.push({
          element: nlSpan,
          expectedChar: '\n',
          status: 'untyped',
          isNewline: true,
          isSpace: false,
          lineIndex: lineIdx,
          parentLine: lineDiv
        });
        globalIndex++;
      }

      lineDiv.appendChild(lineContent);
      this.wordsContainer.appendChild(lineDiv);
    });
  }

  startSession() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.analytics.start();

    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  tick() {
    if (!this.isRunning) return;
    this.timeElapsed++;

    if (this.drillType === 'time') {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.finishSession();
        return;
      }
    }

    this.analytics.takeSample(this.correctChars, this.totalTyped);
    this.emitHUDUpdate();
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  handleKeyDown(e) {
    if (this.isCompleted) return;

    // Ignore special keys (Alt, Meta, Control, CapsLock, Function keys, Arrows, Escape)
    const ignoredKeys = [
      'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'PageUp', 'PageDown', 'Home', 'End', 'Insert', 'ContextMenu',
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
    ];

    if (ignoredKeys.includes(e.key)) {
      return;
    }

    // Handle Quick Restart shortcut: Tab + Enter or handled by app
    if (e.key === 'Tab') {
      e.preventDefault();
      // If code mode, type tab indent (2 spaces)
      if (this.mode === 'code') {
        this.processCharInput(' ');
        this.processCharInput(' ');
      }
      return;
    }

    if (!this.isRunning) {
      this.startSession();
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      this.handleBackspace(e.ctrlKey || e.altKey);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      this.processCharInput('\n');
      return;
    }

    if (e.key.length === 1) {
      e.preventDefault();
      this.processCharInput(e.key);
    }
  }

  handleInput(e) {
    // Fallback for mobile virtual keyboards that fire input events
    if (this.isCompleted) return;
    if (e.inputType === 'deleteContentBackward') {
      this.handleBackspace(false);
      return;
    }
    if (e.data && e.data.length > 0) {
      if (!this.isRunning) this.startSession();
      for (const ch of e.data) {
        this.processCharInput(ch);
      }
      this.hiddenInput.value = "";
    }
  }

  processCharInput(typedChar) {
    if (this.activeCharIndex >= this.charElements.length) {
      this.finishSession();
      return;
    }

    const curr = this.charElements[this.activeCharIndex];
    const isCorrect = (typedChar === curr.expectedChar);

    this.totalTyped++;
    this.analytics.recordKeystroke(isCorrect, curr.expectedChar, typedChar);

    // Audio feedback
    Sound.playKey(!isCorrect, typedChar === ' ' || curr.isSpace);

    if (isCorrect) {
      curr.status = 'correct';
      curr.element.className = 'char correct' + (curr.isSpace ? ' space-marker' : '') + (curr.isNewline ? ' newline-symbol' : '');
      this.correctChars++;
    } else {
      curr.status = 'incorrect';
      curr.element.className = 'char incorrect' + (curr.isSpace ? ' space-marker' : '') + (curr.isNewline ? ' newline-symbol' : '');
      if (curr.parentWord) {
        curr.parentWord.classList.add('is-error');
      }
    }

    this.activeCharIndex++;

    // Advance active code line if applicable
    if (curr.isNewline && curr.parentLine) {
      curr.parentLine.classList.remove('is-active');
      const nextItem = this.charElements[this.activeCharIndex];
      if (nextItem && nextItem.parentLine) {
        nextItem.parentLine.classList.add('is-active');
      }
    }

    // Check completion condition
    if (this.activeCharIndex >= this.charElements.length) {
      this.finishSession();
      return;
    }

    this.updateCaretPosition();
    this.emitHUDUpdate();
  }

  handleBackspace(isWordDelete = false) {
    if (this.activeCharIndex <= 0) return;

    if (isWordDelete) {
      // Delete back to start of current word or whitespace
      do {
        this.stepBackOneChar();
      } while (
        this.activeCharIndex > 0 &&
        !this.charElements[this.activeCharIndex - 1].isSpace &&
        !this.charElements[this.activeCharIndex - 1].isNewline
      );
    } else {
      this.stepBackOneChar();
    }

    this.updateCaretPosition();
    this.emitHUDUpdate();
  }

  stepBackOneChar() {
    if (this.activeCharIndex <= 0) return;
    this.activeCharIndex--;
    const prev = this.charElements[this.activeCharIndex];
    if (prev.status === 'correct') {
      this.correctChars = Math.max(0, this.correctChars - 1);
    }

    prev.status = 'untyped';
    prev.element.className = 'char untyped' + (prev.isSpace ? ' space-marker' : '') + (prev.isNewline ? ' newline-symbol' : '');

    // If step back across lines
    if (prev.isNewline && prev.parentLine) {
      const nextLine = this.charElements[this.activeCharIndex + 1]?.parentLine;
      if (nextLine) nextLine.classList.remove('is-active');
      prev.parentLine.classList.add('is-active');
    }
  }

  updateCaretPosition() {
    if (!this.caretElement || !this.arenaElement) return;

    let targetEl = null;
    let isAtEnd = false;

    if (this.activeCharIndex < this.charElements.length) {
      targetEl = this.charElements[this.activeCharIndex].element;
    } else if (this.charElements.length > 0) {
      targetEl = this.charElements[this.charElements.length - 1].element;
      isAtEnd = true;
    }

    if (!targetEl) {
      this.caretElement.style.display = 'none';
      return;
    }

    this.caretElement.style.display = 'block';

    const arenaRect = this.arenaElement.getBoundingClientRect();
    const charRect = targetEl.getBoundingClientRect();

    let left = isAtEnd ? (charRect.right - arenaRect.left) : (charRect.left - arenaRect.left);
    let top = (charRect.top - arenaRect.top) + this.arenaElement.scrollTop;
    let height = charRect.height || 28;

    this.caretElement.style.left = `${left}px`;
    this.caretElement.style.top = `${top}px`;
    this.caretElement.style.height = `${height}px`;

    // Smooth auto-scroll active line into view
    this.scrollIntoFocus(targetEl);
  }

  scrollIntoFocus(targetEl) {
    if (!targetEl || !this.wordsContainer) return;
    const arenaRect = this.arenaElement.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    // If character is below the middle of the typing arena, shift viewport up
    const relativeTop = targetRect.top - arenaRect.top;
    if (relativeTop > arenaRect.height * 0.55) {
      const shiftY = relativeTop - (arenaRect.height * 0.35);
      const currentTransform = this.wordsContainer.style.transform;
      const currentYMatch = currentTransform.match(/translateY\((-?\d+(?:\.\d+)?)px\)/);
      const currentY = currentYMatch ? parseFloat(currentYMatch[1]) : 0;
      this.wordsContainer.style.transform = `translateY(${currentY - shiftY}px)`;
    } else if (relativeTop < 20) {
      this.wordsContainer.style.transform = `translateY(0px)`;
    }
  }

  emitHUDUpdate() {
    const elapsedMinutes = Math.max(0.01, this.timeElapsed / 60);
    const liveWpm = Math.max(0, Math.round((this.correctChars / 5) / elapsedMinutes));
    const liveRawCpm = Math.max(0, Math.round(this.totalTyped / elapsedMinutes));
    const accuracy = this.totalTyped > 0
      ? Math.max(0, Math.min(100, Math.round((this.correctChars / this.totalTyped) * 100)))
      : 100;
    const errors = this.analytics.errorKeystrokes;

    const progress = this.drillType === 'time'
      ? Math.min(100, ((this.timeLimit - this.timeRemaining) / this.timeLimit) * 100)
      : Math.min(100, (this.activeCharIndex / Math.max(1, this.totalChars)) * 100);

    this.onTick({
      wpm: liveWpm,
      rawCpm: liveRawCpm,
      accuracy,
      errors,
      timeDisplay: this.drillType === 'time' ? `${this.timeRemaining}s` : `${this.timeElapsed}s`,
      progress
    });
  }

  finishSession() {
    if (this.isCompleted) return;
    this.isCompleted = true;
    this.stopTimer();

    const results = this.analytics.finalize(this.correctChars, this.totalTyped, this.totalChars);
    results.mode = this.mode;
    results.drillType = this.drillType;

    this.onComplete(results);
  }
}
