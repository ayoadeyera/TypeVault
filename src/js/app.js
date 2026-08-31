/* ==========================================================================
   TypeVault - Application Coordinator & UI Controller
   ========================================================================== */

import { Storage } from './storage.js';
import { generateDrillText } from './modes.js';
import { TypingEngine } from './engine.js';
import { ThemeManager, THEMES, FONTS, CARET_STYLES } from './themes.js';
import { Sound } from './sound.js';
import { AnalyticsTracker } from './analytics.js';

class TypeVaultApp {
  constructor() {
    this.settings = Storage.getSettings();
    this.engine = null;
    this.customSnippets = Storage.getCustomSnippets();
    this.activeCustomText = null;

    this.initDOM();
    this.initSoundAndThemes();
    this.initTypingEngine();
    this.initUIListeners();
    this.renderSubControls();
    this.startNewDrill();
  }

  initDOM() {
    // Top Bar & Controls
    this.dom = {
      appHeader: document.querySelector('.app-header'),
      modePills: document.querySelectorAll('.mode-btn'),
      subControlsBar: document.getElementById('sub-controls-bar'),
      subPillsContainer: document.getElementById('sub-pills-container'),
      durationPillsContainer: document.getElementById('duration-pills-container'),
      btnOpenSettings: document.getElementById('btn-open-settings'),
      btnOpenCustom: document.getElementById('btn-open-custom'),
      btnRestart: document.getElementById('btn-restart'),

      // Arena
      typingArena: document.getElementById('typing-arena'),
      wordsContainer: document.getElementById('words-container'),
      caret: document.getElementById('caret'),
      hiddenInput: document.getElementById('hidden-input'),
      arenaFocusOverlay: document.getElementById('arena-focus-overlay'),

      // Live HUD
      hudWpm: document.getElementById('hud-wpm'),
      hudCpm: document.getElementById('hud-cpm'),
      hudAcc: document.getElementById('hud-acc'),
      hudErrors: document.getElementById('hud-errors'),
      hudTimer: document.getElementById('hud-timer'),
      sessionProgressFill: document.getElementById('session-progress-fill'),

      // Results Modal
      resultsModal: document.getElementById('results-modal'),
      modalCloseBtn: document.getElementById('modal-close-btn'),
      resWpm: document.getElementById('res-wpm'),
      resRawWpm: document.getElementById('res-raw-wpm'),
      resAcc: document.getElementById('res-acc'),
      resConsistency: document.getElementById('res-consistency'),
      resTime: document.getElementById('res-time'),
      resCorrectChars: document.getElementById('res-correct-chars'),
      resErrorChars: document.getElementById('res-error-chars'),
      resExtraChars: document.getElementById('res-extra-chars'),
      resMissedChars: document.getElementById('res-missed-chars'),
      chartContainer: document.getElementById('results-chart-container'),
      btnModalRestart: document.getElementById('btn-modal-restart'),
      btnModalClose: document.getElementById('btn-modal-close'),

      // Settings Drawer
      settingsDrawer: document.getElementById('settings-drawer'),
      drawerBackdrop: document.getElementById('drawer-backdrop'),
      drawerCloseBtn: document.getElementById('drawer-close-btn'),
      themesGrid: document.getElementById('theme-options-grid'),
      fontSelect: document.getElementById('font-select'),
      caretSelect: document.getElementById('caret-select'),
      soundToggle: document.getElementById('sound-toggle'),
      soundTypeSelect: document.getElementById('sound-type-select'),
      volumeSlider: document.getElementById('volume-slider'),
      targetWpmInput: document.getElementById('target-wpm-input'),
      targetWpmValue: document.getElementById('target-wpm-value'),

      // Custom Sandbox Modal
      customModal: document.getElementById('custom-modal'),
      customModalCloseBtn: document.getElementById('custom-modal-close-btn'),
      customSnippetTitle: document.getElementById('custom-snippet-title'),
      customSnippetText: document.getElementById('custom-snippet-text'),
      btnSaveCustom: document.getElementById('btn-save-custom'),
      btnStartCustomDrill: document.getElementById('btn-start-custom-drill'),
      savedSnippetsList: document.getElementById('saved-snippets-list'),

      // Toast
      toastContainer: document.getElementById('toast-container')
    };
  }

  initSoundAndThemes() {
    ThemeManager.applyTheme(this.settings.theme);
    ThemeManager.applyFont(this.settings.font);
    ThemeManager.applyCaretStyle(this.settings.caretStyle, this.dom.caret);

    Sound.setConfig(
      this.settings.soundEnabled,
      this.settings.soundType,
      this.settings.volume
    );

    // Populate theme picker grid
    this.renderThemePicker();
    this.renderFontPicker();
    this.renderCaretPicker();

    // Populate Sound & WPM settings controls
    if (this.dom.soundToggle) {
      this.dom.soundToggle.checked = this.settings.soundEnabled;
    }
    if (this.dom.soundTypeSelect) {
      this.dom.soundTypeSelect.value = this.settings.soundType;
    }
    if (this.dom.volumeSlider) {
      this.dom.volumeSlider.value = Math.round(this.settings.volume * 100);
    }
    if (this.dom.targetWpmInput) {
      this.dom.targetWpmInput.value = this.settings.targetWpm || 80;
      if (this.dom.targetWpmValue) {
        this.dom.targetWpmValue.textContent = `${this.settings.targetWpm || 80} WPM`;
      }
    }
  }

  initTypingEngine() {
    this.engine = new TypingEngine({
      arenaElement: this.dom.typingArena,
      wordsContainer: this.dom.wordsContainer,
      caretElement: this.dom.caret,
      hiddenInput: this.dom.hiddenInput,
      onTick: (metrics) => this.handleEngineTick(metrics),
      onComplete: (results) => this.handleEngineComplete(results)
    });
  }

  initUIListeners() {
    // Mode Buttons
    this.dom.modePills.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.setMode(mode);
      });
    });

    // Quick Restart
    this.dom.btnRestart.addEventListener('click', () => {
      this.startNewDrill();
      this.showToast('Drill reset');
    });

    // Global Key Listener for Tab + Enter Quick Restart
    let isTabPressed = false;
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        isTabPressed = true;
      }
      if (e.key === 'Enter' && isTabPressed) {
        e.preventDefault();
        this.closeResultsModal();
        this.startNewDrill();
        this.showToast('Restarted drill');
      }
      if (e.key === 'Escape') {
        this.closeResultsModal();
        this.closeSettingsDrawer();
        this.closeCustomModal();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Tab') {
        isTabPressed = false;
      }
    });

    // Arena click
    this.dom.typingArena.addEventListener('click', () => {
      this.engine.focus();
    });

    // Settings Drawer
    this.dom.btnOpenSettings.addEventListener('click', () => this.openSettingsDrawer());
    this.dom.drawerCloseBtn.addEventListener('click', () => this.closeSettingsDrawer());
    this.dom.drawerBackdrop.addEventListener('click', () => this.closeSettingsDrawer());

    // Custom Snippet Manager
    if (this.dom.btnOpenCustom) {
      this.dom.btnOpenCustom.addEventListener('click', () => this.openCustomModal());
    }
    if (this.dom.customModalCloseBtn) {
      this.dom.customModalCloseBtn.addEventListener('click', () => this.closeCustomModal());
    }

    // Results Modal Buttons
    this.dom.modalCloseBtn.addEventListener('click', () => this.closeResultsModal());
    this.dom.btnModalClose.addEventListener('click', () => this.closeResultsModal());
    this.dom.btnModalRestart.addEventListener('click', () => {
      this.closeResultsModal();
      this.startNewDrill();
    });

    // Sound Controls
    this.dom.soundToggle.addEventListener('change', (e) => {
      this.settings.soundEnabled = e.target.checked;
      Storage.saveSettings(this.settings);
      Sound.setConfig(this.settings.soundEnabled, this.settings.soundType, this.settings.volume);
    });

    this.dom.soundTypeSelect.addEventListener('change', (e) => {
      this.settings.soundType = e.target.value;
      Storage.saveSettings(this.settings);
      Sound.setConfig(this.settings.soundEnabled, this.settings.soundType, this.settings.volume);
      Sound.playKey(false, false);
    });

    this.dom.volumeSlider.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value, 10) / 100;
      this.settings.volume = vol;
      Storage.saveSettings(this.settings);
      Sound.setConfig(this.settings.soundEnabled, this.settings.soundType, this.settings.volume);
    });

    // Target WPM
    this.dom.targetWpmInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.settings.targetWpm = val;
      this.dom.targetWpmValue.textContent = `${val} WPM`;
      Storage.saveSettings(this.settings);
    });

    // Custom Snippet Actions
    this.dom.btnSaveCustom.addEventListener('click', () => this.handleSaveCustomSnippet());
    this.dom.btnStartCustomDrill.addEventListener('click', () => this.handleStartCustomDirect());
  }

  setMode(mode) {
    this.settings.activeMode = mode;
    // Set default sub-mode per category
    if (mode === 'speed' && !['100', '200', '500'].includes(this.settings.activeSubMode)) {
      this.settings.activeSubMode = '100';
    } else if (mode === 'code' && !['javascript', 'python', 'html_css', 'sql', 'bash'].includes(this.settings.activeSubMode)) {
      this.settings.activeSubMode = 'javascript';
    }

    Storage.saveSettings(this.settings);
    this.updateModePillsUI();
    this.renderSubControls();
    this.startNewDrill();
  }

  updateModePillsUI() {
    this.dom.modePills.forEach(btn => {
      if (btn.dataset.mode === this.settings.activeMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  renderSubControls() {
    this.dom.subPillsContainer.innerHTML = '';
    this.dom.durationPillsContainer.innerHTML = '';

    const mode = this.settings.activeMode;

    // Sub-mode options
    if (mode === 'speed') {
      const pools = [
        { id: '100', label: '100 Common' },
        { id: '200', label: '200 Words' },
        { id: '500', label: '500 Extended' }
      ];
      pools.forEach(p => {
        const btn = document.createElement('button');
        btn.className = `sub-pill-btn ${this.settings.activeSubMode === p.id ? 'active' : ''}`;
        btn.textContent = p.label;
        btn.addEventListener('click', () => {
          this.settings.activeSubMode = p.id;
          Storage.saveSettings(this.settings);
          this.renderSubControls();
          this.startNewDrill();
        });
        this.dom.subPillsContainer.appendChild(btn);
      });
    } else if (mode === 'accuracy') {
      const item = document.createElement('span');
      item.className = 'stat-sub';
      item.textContent = 'Mixed symbols, numbers & syntax precision';
      this.dom.subPillsContainer.appendChild(item);
    } else if (mode === 'code') {
      const langs = [
        { id: 'javascript', label: 'JavaScript' },
        { id: 'python', label: 'Python' },
        { id: 'html_css', label: 'HTML/CSS' },
        { id: 'sql', label: 'SQL' },
        { id: 'bash', label: 'Bash' }
      ];
      langs.forEach(lang => {
        const btn = document.createElement('button');
        btn.className = `sub-pill-btn ${this.settings.activeSubMode === lang.id ? 'active' : ''}`;
        btn.textContent = lang.label;
        btn.addEventListener('click', () => {
          this.settings.activeSubMode = lang.id;
          Storage.saveSettings(this.settings);
          this.renderSubControls();
          this.startNewDrill();
        });
        this.dom.subPillsContainer.appendChild(btn);
      });
    } else if (mode === 'custom') {
      const btnManage = document.createElement('button');
      btnManage.className = 'sub-pill-btn active';
      btnManage.innerHTML = `✏️ Custom Snippet Manager`;
      btnManage.addEventListener('click', () => this.openCustomModal());
      this.dom.subPillsContainer.appendChild(btnManage);
    }

    // Duration / Word Count Switcher
    if (mode !== 'code') {
      // Toggle Type: Words vs Time
      const wordOptions = [25, 50, 100];
      const timeOptions = [15, 30, 60, 120];

      // Duration mode buttons
      const isWords = this.settings.drillType === 'words';

      // Type selector
      const toggleGroup = document.createElement('div');
      toggleGroup.className = 'sub-pills-group';

      const btnWordsMode = document.createElement('button');
      btnWordsMode.className = `sub-pill-btn ${isWords ? 'active' : ''}`;
      btnWordsMode.textContent = 'Words';
      btnWordsMode.addEventListener('click', () => {
        this.settings.drillType = 'words';
        Storage.saveSettings(this.settings);
        this.renderSubControls();
        this.startNewDrill();
      });

      const btnTimeMode = document.createElement('button');
      btnTimeMode.className = `sub-pill-btn ${!isWords ? 'active' : ''}`;
      btnTimeMode.textContent = 'Timed';
      btnTimeMode.addEventListener('click', () => {
        this.settings.drillType = 'time';
        Storage.saveSettings(this.settings);
        this.renderSubControls();
        this.startNewDrill();
      });

      toggleGroup.appendChild(btnWordsMode);
      toggleGroup.appendChild(btnTimeMode);
      this.dom.durationPillsContainer.appendChild(toggleGroup);

      // Divider
      const div = document.createElement('div');
      div.className = 'sub-divider';
      this.dom.durationPillsContainer.appendChild(div);

      // Value options
      const valuesGroup = document.createElement('div');
      valuesGroup.className = 'sub-pills-group';

      if (isWords) {
        wordOptions.forEach(cnt => {
          const btn = document.createElement('button');
          btn.className = `sub-pill-btn ${this.settings.wordCount === cnt ? 'active' : ''}`;
          btn.textContent = cnt;
          btn.addEventListener('click', () => {
            this.settings.wordCount = cnt;
            Storage.saveSettings(this.settings);
            this.renderSubControls();
            this.startNewDrill();
          });
          valuesGroup.appendChild(btn);
        });
      } else {
        timeOptions.forEach(sec => {
          const btn = document.createElement('button');
          btn.className = `sub-pill-btn ${this.settings.timeLimit === sec ? 'active' : ''}`;
          btn.textContent = `${sec}s`;
          btn.addEventListener('click', () => {
            this.settings.timeLimit = sec;
            Storage.saveSettings(this.settings);
            this.renderSubControls();
            this.startNewDrill();
          });
          valuesGroup.appendChild(btn);
        });
      }
      this.dom.durationPillsContainer.appendChild(valuesGroup);
    }
  }

  startNewDrill() {
    this.updateModePillsUI();
    const mode = this.settings.activeMode;
    const subMode = this.settings.activeSubMode;
    const drillType = this.settings.drillType;
    const countOrTime = drillType === 'time' ? this.settings.timeLimit : this.settings.wordCount;

    let targetText = "";
    if (mode === 'custom' && this.activeCustomText) {
      targetText = this.activeCustomText;
    } else {
      targetText = generateDrillText(mode, subMode, countOrTime);
    }

    this.engine.loadDrill(targetText, mode, drillType, countOrTime);
    this.resetHUD();
    this.engine.focus();
  }

  resetHUD() {
    this.dom.hudWpm.textContent = "0";
    this.dom.hudCpm.textContent = "0";
    this.dom.hudAcc.textContent = "100%";
    this.dom.hudErrors.textContent = "0";
    this.dom.hudTimer.textContent = this.settings.drillType === 'time' ? `${this.settings.timeLimit}s` : '0s';
    this.dom.sessionProgressFill.style.width = '0%';
  }

  handleEngineTick(metrics) {
    this.dom.hudWpm.textContent = metrics.wpm;
    this.dom.hudCpm.textContent = metrics.rawCpm;
    this.dom.hudAcc.textContent = `${metrics.accuracy}%`;
    this.dom.hudErrors.textContent = metrics.errors;
    this.dom.hudTimer.textContent = metrics.timeDisplay;
    this.dom.sessionProgressFill.style.width = `${metrics.progress}%`;
  }

  handleEngineComplete(results) {
    // Save to storage
    Storage.saveSessionScore(results);

    // Populate Results Modal
    this.dom.resWpm.textContent = results.wpm;
    this.dom.resRawWpm.textContent = results.rawWpm;
    this.dom.resAcc.textContent = `${results.accuracy}%`;
    this.dom.resConsistency.textContent = `${results.consistency}%`;
    this.dom.resTime.textContent = `${results.timeSeconds}s`;
    this.dom.resCorrectChars.textContent = results.correctKeystrokes;
    this.dom.resErrorChars.textContent = results.errorKeystrokes;
    this.dom.resExtraChars.textContent = results.extraCharacters;
    this.dom.resMissedChars.textContent = results.missedCharacters;

    // Render SVG performance sparkline
    AnalyticsTracker.renderSvgChart(results.samples, this.dom.chartContainer);

    // Open Modal
    this.openResultsModal();
  }

  openResultsModal() {
    this.dom.resultsModal.classList.add('open');
    if (this.dom.btnModalRestart) {
      this.dom.btnModalRestart.focus();
    }
  }

  closeResultsModal() {
    this.dom.resultsModal.classList.remove('open');
    this.engine.focus();
  }

  // ------------------------------------------------------------------------
  // Settings Drawer
  // ------------------------------------------------------------------------
  openSettingsDrawer() {
    this.dom.drawerBackdrop.classList.add('open');
    this.dom.settingsDrawer.classList.add('open');
  }

  closeSettingsDrawer() {
    this.dom.drawerBackdrop.classList.remove('open');
    this.dom.settingsDrawer.classList.remove('open');
    this.engine.focus();
  }

  renderThemePicker() {
    this.dom.themesGrid.innerHTML = '';
    THEMES.forEach(t => {
      const btn = document.createElement('button');
      btn.className = `theme-card-btn ${this.settings.theme === t.id ? 'active' : ''}`;
      btn.innerHTML = `
        <div class="theme-color-dots">
          ${t.colors.map(c => `<span class="theme-dot" style="background-color:${c}"></span>`).join('')}
        </div>
        <span>${t.name}</span>
      `;
      btn.addEventListener('click', () => {
        this.settings.theme = t.id;
        Storage.saveSettings(this.settings);
        ThemeManager.applyTheme(t.id);
        this.renderThemePicker();
        this.showToast(`Theme: ${t.name}`);
      });
      this.dom.themesGrid.appendChild(btn);
    });
  }

  renderFontPicker() {
    this.dom.fontSelect.innerHTML = '';
    FONTS.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      if (f.id === this.settings.font) opt.selected = true;
      this.dom.fontSelect.appendChild(opt);
    });

    this.dom.fontSelect.addEventListener('change', (e) => {
      this.settings.font = e.target.value;
      Storage.saveSettings(this.settings);
      ThemeManager.applyFont(this.settings.font);
      this.engine.updateCaretPosition();
      this.showToast(`Font: ${this.settings.font}`);
    });
  }

  renderCaretPicker() {
    this.dom.caretSelect.innerHTML = '';
    CARET_STYLES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      if (c.id === this.settings.caretStyle) opt.selected = true;
      this.dom.caretSelect.appendChild(opt);
    });

    this.dom.caretSelect.addEventListener('change', (e) => {
      this.settings.caretStyle = e.target.value;
      Storage.saveSettings(this.settings);
      ThemeManager.applyCaretStyle(this.settings.caretStyle, this.dom.caret);
    });
  }

  // ------------------------------------------------------------------------
  // Custom Snippet Manager
  // ------------------------------------------------------------------------
  openCustomModal() {
    this.renderCustomSnippetsList();
    this.dom.customModal.classList.add('open');
  }

  closeCustomModal() {
    this.dom.customModal.classList.remove('open');
    this.engine.focus();
  }

  renderCustomSnippetsList() {
    const list = Storage.getCustomSnippets();
    this.dom.savedSnippetsList.innerHTML = '';

    if (list.length === 0) {
      this.dom.savedSnippetsList.innerHTML = '<p class="stat-sub">No custom snippets saved yet.</p>';
      return;
    }

    list.forEach(item => {
      const row = document.createElement('div');
      row.className = 'snippet-item';
      row.innerHTML = `
        <div>
          <strong>${item.title}</strong>
          <span class="stat-sub" style="margin-left: 0.5rem">(${item.text.length} chars)</span>
        </div>
        <div class="snippet-item-actions">
          <button class="btn-snippet-load" data-id="${item.id}">Load & Drill</button>
          <button class="btn-snippet-del" data-id="${item.id}">✕</button>
        </div>
      `;

      row.querySelector('.btn-snippet-load').addEventListener('click', () => {
        this.activeCustomText = item.text;
        this.settings.activeMode = 'custom';
        this.settings.activeCustomId = item.id;
        Storage.saveSettings(this.settings);
        this.closeCustomModal();
        this.renderSubControls();
        this.startNewDrill();
        this.showToast(`Loaded: ${item.title}`);
      });

      row.querySelector('.btn-snippet-del').addEventListener('click', () => {
        Storage.deleteCustomSnippet(item.id);
        this.renderCustomSnippetsList();
        this.showToast('Snippet deleted');
      });

      this.dom.savedSnippetsList.appendChild(row);
    });
  }

  handleSaveCustomSnippet() {
    const title = (this.dom.customSnippetTitle.value || "").trim() || "Untitled Drill";
    const text = (this.dom.customSnippetText.value || "").trim();

    if (!text) {
      this.showToast('Please enter drill text first!');
      return;
    }

    Storage.saveCustomSnippet(title, text);
    this.dom.customSnippetTitle.value = '';
    this.dom.customSnippetText.value = '';
    this.renderCustomSnippetsList();
    this.showToast('Custom snippet saved!');
  }

  handleStartCustomDirect() {
    const text = (this.dom.customSnippetText.value || "").trim();
    if (!text) {
      this.showToast('Please enter drill text first!');
      return;
    }

    this.activeCustomText = text;
    this.settings.activeMode = 'custom';
    Storage.saveSettings(this.settings);
    this.closeCustomModal();
    this.renderSubControls();
    this.startNewDrill();
    this.showToast('Started custom drill');
  }

  // ------------------------------------------------------------------------
  // Toast Notifications
  // ------------------------------------------------------------------------
  showToast(message) {
    if (!this.dom.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px) scale(0.95)';
      setTimeout(() => toast.remove(), 200);
    }, 2200);
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.TypeVault = new TypeVaultApp();
});
