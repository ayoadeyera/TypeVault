# Implementation Plan - TypeVault Typing Training Web Application

TypeVault is a modern, responsive, client-side web application designed to train typing speed, accuracy, syntax precision, and typing flexibility. It is built using HTML5, modern CSS custom properties, and modular Vanilla JavaScript (ES Modules) without heavy external dependencies.

## Proposed Architecture & Structure

```
TypeVault/
├── index.html              # Semantic HTML5 layout with arena, analytics, modals, drawer
├── css/
│   ├── main.css            # Base styles, CSS custom variables, typography, theme definitions
│   ├── typing.css          # Typing arena, caret animations, character/word highlighting, code lines
│   └── components.css      # Analytics cards, modals, settings drawer, SVG chart, custom manager
└── js/
    ├── app.js              # Application entry point, event listeners, state coordination
    ├── engine.js           # Core typing engine: input parsing, caret position, backspace, accuracy
    ├── modes.js            # Text generation & data banks (Speed, Symbols, Code Syntax, Custom)
    ├── analytics.js        # Real-time analytics (WPM, CPM, Accuracy, Consistency) & SVG chart renderer
    ├── storage.js          # LocalStorage persistence (settings, custom snippets, best records)
    ├── sound.js            # Web Audio API procedural mechanical keyboard sound effects
    └── themes.js           # Theme and font management
```

## Key Features & Proposed Implementation

### 1. Drill Modes & Content Generators (`js/modes.js`)
- **Speed & Flow**: English word pools (100, 200, 500 common words) generating varied natural sentence flows.
- **Accuracy & Symbols**: Texts rich in symbols (`!@#$%^&*()_+-=[]{}:;"'<>,.?/`), mixed casing, numbers, and technical vocabulary.
- **Code & CS Syntax**: Curated, syntactically correct multi-line and single-line snippets across:
  - **JavaScript (ES6+)**: `async/await`, array methods, destructuring, promises, classes.
  - **Python**: List comprehensions, decorators, dictionaries, standard library utilities.
  - **HTML/CSS**: Flexbox/Grid CSS declarations, semantic tags, animations.
  - **SQL**: `SELECT`, `JOIN`, `GROUP BY`, subqueries, CTEs.
  - **Bash**: Pipe chains, find/grep commands, conditional scripting.
- **Custom Sandbox**: Text area input for immediate drills, with ability to save, name, categorize, and delete custom drill snippets into persistent buckets.

### 2. Typing Engine (`js/engine.js`)
- **Visual Character Rendering**: Every character (and whitespace/newline) rendered in a tokenized structure with distinct states:
  - Untyped, Correct (`var(--color-correct)`), Incorrect (`var(--color-incorrect)`), Extra over-typed characters.
  - Whitespace indicator (subtle dot or visible space) and Enter/Newline glyphs for code blocks.
- **Smooth Caret System**: Fluid animated caret following current character index, supporting multiple styles (line, block, underline).
- **Multi-line & Code Indentation**: Handles Tab key (inserts 2 spaces or tabs) and Enter key without losing focus or breaking document flow.
- **Non-character / Modifier Key Filtering**: Ignores `Shift`, `Alt`, `Control`, `Meta`, `CapsLock`, `Tab` navigation outside drills, and function keys without falsely penalizing accuracy.
- **Line Scrolling**: Automatically shifts text lines smoothly so the active line remains centered in the typing viewport.

### 3. Real-Time Analytics & SVG Performance Chart (`js/analytics.js`)
- **Standard Formulas**:
  - Live WPM = `(Total Correct Characters / 5) / (Time in Minutes)`.
  - Raw CPM = `(Total Keystrokes / Time in Minutes)`.
  - Accuracy = `(Correct Keystrokes / Total Keystrokes) * 100%`.
  - Consistency score calculated via standard deviation of keystroke intervals.
- **Live HUD**: Displays real-time WPM, CPM, Accuracy, Error count, and active Countdown/Elapsed Timer.
- **Results Modal**:
  - Breakdown: WPM, Raw WPM, Accuracy %, Total Time, Correct/Incorrect/Missed/Extra chars.
  - Interactive SVG Sparkline/Line Chart showing typing speed progression second-by-second with red markers on errors.
  - Restart hotkey triggers (`Tab + Enter` or `Esc`).

### 4. Customization & Settings Drawer (`js/storage.js`, `js/themes.js`, `js/sound.js`)
- **Themes**:
  - Cyberpunk (Neon cyan & hot magenta)
  - Monokai (Pro developer dark)
  - Nord (Arctic slate blue)
  - Dark (Modern midnight obsidian)
  - Light (Crisp paper minimalism)
  - Matrix (Phosphor hacker green)
  - High Contrast (OLED Pure Black & Bright Amber)
- **Monospace Fonts**: JetBrains Mono, Fira Code, Consolas, Courier New, Inconsolata (Google Fonts loaded with local fallback).
- **Sound Synthesizer**: Procedural mechanical switch audio generated using Web Audio API (Clicky Blue, Tactile Brown, Thocky Linear, and Error Buzz) with zero external MP3 assets.
- **Duration / Word Count Configs**: Words (25, 50, 100) or Timed (15s, 30s, 60s, 120s).
- **Target WPM Pacer**: Optional visual ghost pacer or progress bar.

## Verification Plan

### Automated & Unit Testing
- Validate JavaScript modules syntax and exports.
- Run local server via PowerShell `python -m http.server` or Node `npx serve` to verify ES Modules loading.

### Manual & Interactive Browser Testing (via `browser_subagent`)
- Load `http://localhost:<port>` in headless Chrome.
- Test Mode Switching: Speed & Flow, Accuracy & Symbols, Code Syntax (JS, Python, SQL, etc.), Custom Sandbox.
- Test Typing Interaction: Type correct characters, make deliberate mistakes, backspace, verify live WPM/Accuracy updates.
- Test Code Navigation: Multi-line Enter and Tab indentation.
- Test Results Modal: Complete a 15s session, verify SVG chart rendering, test `Tab + Enter` quick restart.
- Test Settings Drawer: Switch themes (e.g. Cyberpunk, Nord), change fonts, toggle sounds, configure custom snippets.
- Verify responsive layout on mobile (375px), tablet (768px), and desktop (1280px).
