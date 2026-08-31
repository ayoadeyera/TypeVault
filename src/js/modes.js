/* ==========================================================================
   TypeVault - Drill Modes & Content Generators
   ========================================================================== */

// 1. High Frequency English Word Pools for Speed & Flow
export const WORD_POOLS = {
  pool100: [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with",
    "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her",
    "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up",
    "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time",
    "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could",
    "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think",
    "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even",
    "new", "want", "because", "any", "these", "give", "day", "most", "us"
  ],
  pool200: [
    "great", "same", "tell", "much", "must", "big", "group", "begin", "seem", "country", "help", "talk",
    "where", "turn", "problem", "every", "start", "hand", "might", "show", "part", "against", "place",
    "such", "again", "few", "case", "week", "company", "system", "each", "right", "program", "hear",
    "question", "during", "work", "play", "government", "run", "small", "number", "off", "always",
    "move", "night", "live", "Mr", "point", "believe", "hold", "today", "bring", "happen", "next",
    "without", "before", "large", "million", "must", "home", "under", "water", "room", "write", "mother",
    "area", "national", "money", "story", "young", "fact", "month", "different", "lot", "right", "study",
    "book", "eye", "job", "word", "though", "business", "issue", "side", "kind", "four", "head", "far",
    "black", "long", "both", "little", "house", "yes", "after", "since", "long", "provide", "service",
    "around", "friend", "important", "father", "sit", "away", "until", "power", "hour", "game", "often",
    "yet", "line", "political", "end", "among", "ever", "stand", "bad", "lose", "however", "member", "pay",
    "law", "meet", "car", "city", "almost", "include", "continue", "set", "later", "community", "much",
    "name", "five", "once", "white", "least", "president", "learn", "real", "change", "team", "minute",
    "best", "several", "idea", "kid", "body", "information", "nothing", "ago", "right", "lead", "social",
    "understand", "whether", "back", "watch", "together", "follow", "around", "parent", "only", "stop",
    "face", "anything", "create", "public", "already", "speak", "others", "read", "level", "allow", "add"
  ],
  pool500: [
    "office", "spend", "door", "health", "person", "art", "sure", "war", "history", "party", "within",
    "grow", "result", "open", "morning", "walk", "reason", "low", "win", "research", "girl", "guy",
    "early", "food", "moment", "himself", "air", "teacher", "force", "offer", "enough", "education",
    "across", "although", "remember", "foot", "second", "boy", "maybe", "toward", "able", "age",
    "policy", "everything", "love", "process", "music", "including", "consider", "appear", "actually",
    "buy", "probably", "human", "wait", "serve", "market", "someone", "die", "send", "expect", "sense",
    "build", "stay", "fall", "nation", "plan", "cut", "college", "interest", "death", "course",
    "someone", "experience", "behind", "reach", "local", "kill", "six", "remain", "effect", "use",
    "yeah", "suggest", "class", "control", "raise", "care", "perhaps", "little", "late", "hard",
    "field", "else", "pass", "former", "sell", "major", "sometimes", "require", "along", "development",
    "themselves", "report", "role", "better", "economic", "effort", "decide", "rate", "strong", "possible",
    "heart", "drug", "show", "leader", "light", "voice", "wife", "whole", "police", "mind", "finally",
    "pull", "return", "free", "military", "price", "report", "less", "according", "decision", "explain",
    "son", "hope", "even", "develop", "view", "relationship", "carry", "town", "road", "drive", "arm",
    "true", "federal", "break", "better", "difference", "thank", "receive", "value", "international",
    "building", "action", "full", "model", "join", "season", "society", "because", "tax", "director",
    "early", "position", "player", "agree", "especially", "record", "pick", "wear", "paper", "special",
    "space", "ground", "form", "support", "event", "official", "whose", "matter", "everyone", "center",
    "couple", "site", "project", "base", "activity", "star", "table", "need", "court", "produce", "eat",
    "American", "teach", "oil", "half", "situation", "easy", "cost", "industry", "figure", "face", "street",
    "image", "itself", "phone", "either", "data", "cover", "quite", "picture", "clear", "practice", "piece",
    "land", "recent", "describe", "product", "doctor", "wall", "patient", "worker", "news", "test", "movie",
    "certain", "north", "personal", "simply", "third", "technology", "catch", "step", "baby", "computer",
    "type", "attention", "draw", "film", "Republican", "tree", "source", "red", "nearly", "organization",
    "choose", "cause", "hair", "look", "point", "century", "evidence", "window", "difficult", "listen",
    "soon", "culture", "billion", "chance", "brother", "energy", "period", "summer", "realize", "hundred",
    "available", "plant", "likely", "opportunity", "term", "short", "letter", "condition", "choice",
    "place", "single", "rule", "daughter", "administration", "south", "husband", "Congress", "floor",
    "campaign", "material", "population", "well", "call", "economy", "medical", "hospital", "church",
    "close", "thousand", "risk", "current", "fire", "future", "wrong", "involve", "defense", "anyone",
    "increase", "security", "bank", "myself", "certainly", "west", "sport", "board", "seek", "per",
    "subject", "officer", "private", "rest", "behavior", "deal", "performance", "fight", "throw", "top",
    "quickly", "past", "goal", "bed", "order", "author", "fill", "represent", "focus", "foreign", "drop",
    "plan", "blood", "upon", "agency", "push", "nature", "color", "no", "recently", "store", "reduce",
    "sound", "note", "fine", "before", "near", "movement", "page", "enter", "share", "than", "common",
    "poor", "other", "natural", "race", "concern", "series", "significant", "similar", "hot", "language"
  ]
};

// 2. Accuracy & Symbols Data Bank
export const SYMBOL_SNIPPETS = [
  "const config = { host: '127.0.0.1', port: 8080, secure: false, retries: 3 };",
  "if (user?.id !== undefined && user.score >= 95.5) { return `Rank #1 (${user.score}%!)`; }",
  "regex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$/;",
  "SELECT id, first_name, email FROM users WHERE balance >= 250.00 AND status = 'ACTIVE';",
  "git commit -m 'feat(auth): fix token validation (#402)' && git push origin main",
  "matrix[i][j] = (vector_a[i] * matrix_b[i][j]) + offset_val / 2.0;",
  "curl -X POST 'https://api.vault.dev/v1/keys?sync=true' -H 'Authorization: Bearer $KEY'",
  "npm i --save-dev typescript@^5.3.0 eslint@>=8.56.0 prettier@~3.2.4",
  "const sum = numbers.reduce((acc, curr) => acc + (curr > 0 ? curr * 1.5 : 0), 0);",
  "key_pairs = {'item_1': 99.9, 'discount': 0.15, 'tax_rate': 0.0825, 'valid': True}",
  "docker run -d -p 3000:3000 --name node-service -e NODE_ENV=production app:v2.1",
  "math_eval = ((x ** 2) + (y ** 2) - 2 * x * y) / (Math.sqrt(z) + 1.0e-5);",
  "chmod 755 ./scripts/deploy.sh && ./scripts/deploy.sh --env=staging --verbose=1",
  "path = os.path.join('/usr/local/bin', f'worker_{process_id:04d}.pid')",
  "const query = `SELECT * FROM audit_logs WHERE created_at BETWEEN '${start}' AND '${end}'`;"
];

// 3. Real-World Code & CS Syntax Snippets
export const CODE_SNIPPETS = {
  javascript: [
    `async function fetchUserData(userId) {
  try {
    const response = await fetch(\`/api/v1/users/\${userId}\`);
    if (!response.ok) {
      throw new Error(\`HTTP error: \${response.status}\`);
    }
    const data = await response.json();
    return { ...data, loadedAt: Date.now() };
  } catch (err) {
    console.error("Failed to load user:", err.message);
    return null;
  }
}`,
    `class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(eventName, listener) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(listener);
    return () => this.off(eventName, listener);
  }

  emit(eventName, ...args) {
    const listeners = this.events.get(eventName) || [];
    listeners.forEach(fn => fn(...args));
  }
}`,
    `const processMetrics = (samples, threshold = 80) => {
  return samples
    .filter(item => item.active && item.score >= threshold)
    .map(item => ({
      id: item.id,
      normalized: Math.round(item.score * 1.25),
      timestamp: new Date(item.ts).toISOString()
    }))
    .sort((a, b) => b.normalized - a.normalized);
};`
  ],
  python: [
    `def binary_search(array: list[int], target: int) -> int:
    left, right = 0, len(array) - 1
    while left <= right:
        mid = (left + right) // 2
        if array[mid] == target:
            return mid
        elif array[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    `from dataclasses import dataclass
from typing import Optional
import json

@dataclass
class SessionRecord:
    session_id: str
    wpm: float
    accuracy: float
    duration_sec: int
    mode: str = "speed"

    def to_dict(self) -> dict:
        return self.__dict__`,
    `import asyncio
import aiohttp

async def fetch_endpoint(url: str, session: aiohttp.ClientSession) -> dict:
    async with session.get(url, timeout=10) as response:
        response.raise_for_status()
        return await response.json()`
  ],
  html_css: [
    `.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  background-color: var(--bg-surface);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}`,
    `@keyframes pulseGlow {
  0% {
    transform: scale(0.98);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
  }
  100% {
    transform: scale(0.98);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}`
  ],
  sql: [
    `WITH RankedScores AS (
  SELECT
    user_id,
    wpm,
    accuracy,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY wpm DESC) as rank
  FROM typing_sessions
  WHERE created_at >= NOW() - INTERVAL '30 days'
)
SELECT u.username, r.wpm, r.accuracy
FROM RankedScores r
JOIN users u ON u.id = r.user_id
WHERE r.rank = 1
ORDER BY r.wpm DESC
LIMIT 50;`,
    `SELECT
  c.category_name,
  COUNT(o.order_id) AS total_orders,
  ROUND(SUM(o.amount), 2) AS gross_revenue
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
LEFT JOIN orders o ON o.product_id = p.id
WHERE o.status = 'COMPLETED'
GROUP BY c.category_name
HAVING SUM(o.amount) > 1000.00;`
  ],
  bash: [
    `#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="\${1:-./dist}"
echo "Building project into \${TARGET_DIR}..."

mkdir -p "\${TARGET_DIR}"
find ./src -name "*.js" -exec cp {} "\${TARGET_DIR}" \\;

tar -czf release-v1.0.tar.gz -C "\${TARGET_DIR}" .
echo "Deployment package generated successfully."`,
    `docker build -t typevault-app:latest .
docker run -d --restart=unless-stopped -p 8080:80 \\
  --name typevault-web \\
  -v $(pwd)/config:/etc/nginx/conf.d:ro \\
  typevault-app:latest`
  ]
};

// 4. Default Custom Drill Text
export const DEFAULT_CUSTOM_SNIPPETS = [
  {
    id: "snip_1",
    title: "JavaScript Async/Await Sample",
    text: "const delay = (ms) => new Promise(res => setTimeout(res, ms));\nawait delay(1000);\nconsole.log('Done!');"
  },
  {
    id: "snip_2",
    title: "The Quick Brown Fox",
    text: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How razorback-jumping frogs can level six piqued gymnasts!"
  },
  {
    id: "snip_3",
    title: "Python List Comprehension",
    text: "squares = [x**2 for x in range(10) if x % 2 == 0]\nprint(f'Even squares: {squares}')"
  }
];

/**
 * Generate drill text according to selected mode and options
 */
export function generateDrillText(mode, subMode, lengthOrWordCount, customText = "") {
  if (mode === "speed") {
    const poolKey = subMode === "500" ? "pool500" : (subMode === "200" ? "pool200" : "pool100");
    const words = [...WORD_POOLS[poolKey], ...WORD_POOLS.pool100];
    const count = typeof lengthOrWordCount === "number" && lengthOrWordCount > 0 ? lengthOrWordCount : 50;
    
    const selected = [];
    let lastWord = "";
    for (let i = 0; i < count; i++) {
      let randWord;
      do {
        randWord = words[Math.floor(Math.random() * words.length)];
      } while (randWord === lastWord);
      selected.push(randWord);
      lastWord = randWord;
    }
    return selected.join(" ");
  }

  if (mode === "accuracy") {
    // Generate text mixed with symbols, numbers, punctuation
    const snippets = [...SYMBOL_SNIPPETS];
    // Shuffle and pick 2-4 snippets
    const shuffled = snippets.sort(() => 0.5 - Math.random());
    const count = typeof lengthOrWordCount === "number" && lengthOrWordCount <= 25 ? 2 : 4;
    return shuffled.slice(0, count).join(" ");
  }

  if (mode === "code") {
    const lang = subMode || "javascript";
    const snippets = CODE_SNIPPETS[lang] || CODE_SNIPPETS.javascript;
    const picked = snippets[Math.floor(Math.random() * snippets.length)];
    return picked;
  }

  if (mode === "custom") {
    if (customText && customText.trim().length > 0) {
      return customText.trim();
    }
    return DEFAULT_CUSTOM_SNIPPETS[0].text;
  }

  return "TypeVault precision typing system initialized.";
}
