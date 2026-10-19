/* ==========================================================================
   Type Station - Server Application Entry Point
   A Product of PluralTech LTD
   ========================================================================== */

import express from 'express';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import indexRoutes from './routes/indexRoutes.js';
import authRoutes from './routes/authRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import { checkConnection } from './db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Zero-dependency .env loader fallback if environment variables are not loaded by node
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static assets (CSS, client JS, images, SVG)
app.use(express.static(path.join(__dirname, 'public')));

// Request parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'typestation_secret_key_pluraltech_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set to true in production with HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  })
);

// Global view variables (user session, current path)
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

// Route registration
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/api', statsRoutes);

// 404 Not Found Page
app.use((req, res) => {
  res.status(404).render('pages/index', {
    title: '404 - Page Not Found — Type Station',
    activePage: 'arena',
    user: req.session?.user || null
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Application Error]', err.stack || err);
  res.status(500).send('Internal Server Error — PluralTech Type Station');
});

// Start listening
app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`⚡ Type Station is running at http://localhost:${PORT}`);
  console.log(`   A Product by PluralTech LTD`);
  console.log(`======================================================\n`);

  // Non-blocking database check
  const dbOk = await checkConnection();
  if (dbOk) {
    console.log('✓ PostgreSQL connected successfully.');
  } else {
    console.log('ℹ PostgreSQL not connected — using graceful in-memory & client storage.');
  }
});

export default app;
