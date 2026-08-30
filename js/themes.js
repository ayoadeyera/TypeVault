/* ==========================================================================
   TypeVault - Themes, Fonts & Visual Customization Manager
   ========================================================================== */

export const THEMES = [
  { id: 'dark', name: 'Obsidian Dark', colors: ['#0b0f19', '#6366f1', '#10b981'] },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', colors: ['#0d0221', '#ff007f', '#00f0ff'] },
  { id: 'monokai', name: 'Monokai Pro', colors: ['#272822', '#a6e22e', '#f92672'] },
  { id: 'nord', name: 'Nord Frost', colors: ['#2e3440', '#88c0d0', '#a3be8c'] },
  { id: 'matrix', name: 'Matrix Terminal', colors: ['#050a05', '#00ff66', '#003b14'] },
  { id: 'oled', name: 'OLED Amber', colors: ['#000000', '#fbbf24', '#ffffff'] },
  { id: 'light', name: 'Paper Clean', colors: ['#f4f6fb', '#2563eb', '#059669'] }
];

export const FONTS = [
  { id: 'JetBrains Mono', name: 'JetBrains Mono', family: "'JetBrains Mono', monospace" },
  { id: 'Fira Code', name: 'Fira Code', family: "'Fira Code', monospace" },
  { id: 'Consolas', name: 'Consolas', family: "Consolas, 'Courier New', monospace" },
  { id: 'Courier New', name: 'Courier New', family: "'Courier New', Courier, monospace" }
];

export const CARET_STYLES = [
  { id: 'caret-line', name: 'Vertical Line' },
  { id: 'caret-block', name: 'Solid Block' },
  { id: 'caret-underline', name: 'Underline' },
  { id: 'caret-hidden', name: 'Hidden' }
];

export const ThemeManager = {
  applyTheme(themeId) {
    const valid = THEMES.find(t => t.id === themeId);
    const selected = valid ? valid.id : 'dark';
    if (selected === 'dark') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', selected);
    }
    return selected;
  },

  applyFont(fontId) {
    const found = FONTS.find(f => f.id === fontId) || FONTS[0];
    document.documentElement.style.setProperty('--font-mono', found.family);
    return found.id;
  },

  applyCaretStyle(styleId, caretElement) {
    if (!caretElement) return styleId;
    CARET_STYLES.forEach(s => caretElement.classList.remove(s.id));
    caretElement.classList.add(styleId || 'caret-line');
    return styleId;
  }
};
