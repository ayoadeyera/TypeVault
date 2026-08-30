# Walkthrough - TypeVault Web Application

TypeVault is a client-side, responsive typing training web application built with Vanilla HTML5, CSS3, and ES6 Modules. It features four primary drill modes, high-frequency word pools, code syntax engines, real-time analytics, procedural mechanical audio synthesis, custom theme engines, and persistent snippet storage.

---

## 🌟 Features Implemented

### 1. Core Architecture & Tech Stack
- **Zero External Framework Dependencies**: Pure modular Vanilla JavaScript (`app.js`, `engine.js`, `modes.js`, `analytics.js`, `storage.js`, `sound.js`, `themes.js`).
- **CSS Custom Properties Design System**: Supports 7 themes, glassmorphism UI, smooth transitions, and monospace font switching.
- **LocalStorage Persistence**: Saves user settings (active mode, visual theme, font choice, caret style, audio settings, target WPM), custom text snippet buckets, and personal best history.

---

### 2. Drill Modes & Content Generators (`js/modes.js`)
- ⚡ **Speed & Flow**: 100, 200, or 500 common English word pools generating varied typing flows.
- 🎯 **Accuracy & Symbols**: Complex technical texts with symbols (`!@#$%^&*()_+-=[]{}:;"'<>,.?/`), mixed casing, and numbers.
- 💻 **Code & CS Syntax**: Real-world multi-line code snippets across:
  - **JavaScript (ES6+)**: `async/await`, Promises, array methods, EventEmitters.
  - **Python**: List comprehensions, dataclasses, `asyncio`, typing annotations.
  - **HTML/CSS**: CSS Grid/Flexbox layouts, `@keyframes` animations.
  - **SQL**: Window functions (`ROW_NUMBER`), CTEs (`WITH`), complex `JOIN`s.
  - **Bash**: Pipeline commands, `curl`, `find`, `docker` execution scripts.
- 🧪 **Custom Sandbox**: Text area input for immediate custom drills, with full snippet management (save, title, load, delete) stored locally.

---

### 3. Typing Engine & UI (`js/engine.js`)
- **Tokenized Visual Rendering**:
  - Untyped characters shown in muted tone.
  - Correctly typed characters turn green with ambient glow (`--color-correct`).
  - Incorrectly typed characters highlight in soft red background with underline (`--color-incorrect`).
  - Extra typed characters beyond word length are dynamically tracked.
- **Smooth Animated Caret**: Glides between character bounding rects with 4 customizable styles (Vertical Line, Solid Block, Underline, Hidden).
- **Line Scrolling**: Automatically shifts text lines smoothly so the active line remains centered in the typing viewport.
- **Special Key Filtering**: Ignores modifier keys (`Shift`, `Alt`, `Ctrl`, `Meta`, `CapsLock`, `Escape`, `F1-F12`) without triggering false error penalties.
- **Multi-line Code Support**: Handles `Enter` for line breaks and `Tab` for indentation.

---

### 4. Real-Time Analytics & SVG Performance Chart (`js/analytics.js`)
- **Formula Standard**:
  - Live WPM = `(Total Correct Characters / 5) / (Time in Minutes)`.
  - Raw CPM = `Total Keystrokes / Time in Minutes`.
  - Accuracy = `(Correct Keystrokes / Total Keystrokes) * 100%`.
  - Consistency Score calculated from typing pace variance.
- **HUD Bar**: Live updates for WPM, Raw CPM, Accuracy %, Error Count, Countdown/Elapsed Timer, and Session Progress Bar.
- **Interactive Results Modal**:
  - Displays Net WPM, Raw WPM, Accuracy %, Consistency %, Session Duration, and Keystroke Error Breakdown (Correct, Error, Extra, Missed).
  - SVG Sparkline Chart rendered second-by-second with error markers.
  - Hotkey triggers: `Tab + Enter` or `Esc` to instantly restart or dismiss.

---

### 5. Customization & Procedural Mechanical Audio (`js/sound.js`, `js/themes.js`)
- **7 Visual Themes**:
  - `Obsidian Dark` (Default Indigo)
  - `Cyberpunk Neon` (Cyan & Hot Pink)
  - `Monokai Pro` (Developer Dark)
  - `Nord Frost` (Arctic Slate)
  - `Matrix Terminal` (Hacker Green)
  - `OLED Amber` (Pure Black & Bright Amber)
  - `Paper Clean` (Light Mode)
- **Monospace Fonts**: JetBrains Mono, Fira Code, Consolas, Courier New.
- **Procedural Mechanical Switch Synthesizer (Web Audio API)**:
  - `Clicky Blue` (Crisp high transient snap)
  - `Tactile Brown` (Gentle bump)
  - `Thocky Linear` (Deep low thock)
  - `Subtle Beep` (Sine wave click)
  - Volume slider and error buzz feedback.

---

## 📁 File Structure

```
c:/Users/SandA/OneDrive/Documents/BYU/WE DEV/TypeVault/
├── index.html              # Main semantic HTML5 layout & modal templates
├── css/
│   ├── main.css            # CSS Custom properties, themes, design tokens, resets
│   ├── typing.css          # Typing arena, caret animations, code line numbers
│   └── components.css      # Analytics HUD cards, modals, drawer, SVG chart
└── js/
    ├── app.js              # Application coordinator & event handler
    ├── engine.js           # Core typing engine: input parsing, caret position, backspace
    ├── modes.js            # Text banks & generators for Speed, Symbols, Code, Custom
    ├── analytics.js        # Analytics tracker & SVG chart generator
    ├── storage.js          # LocalStorage manager (settings, custom snippets, scores)
    ├── sound.js            # Web Audio API mechanical switch synthesizer
    └── themes.js           # Theme and typography controller
```

---

## 🚀 How to Run & Test Locally

1. Launch a local web server in the project directory:
   ```bash
   python -m http.server 8085
   ```
2. Open your web browser to [http://localhost:8085](http://localhost:8085).
3. Select any drill mode (Speed & Flow, Accuracy & Symbols, Code & CS Syntax, Custom Sandbox).
4. Click the arena and start typing! Press `Tab + Enter` at any time to instantly restart.
