/* ==========================================================================
   Type Station - Stats, History & Goals API Routes
   A Product of PluralTech LTD
   ========================================================================== */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// POST /api/stats - Record typing session
router.post('/stats', async (req, res) => {
  const user = req.session?.user;
  const { mode, subMode, wpm, rawWpm, accuracy, consistency, timeSeconds, errorCount, charBreakdown } = req.body;

  if (!user) {
    // Guest mode: session successfully acknowledged without DB save
    return res.json({ success: true, guest: true });
  }

  try {
    await query(
      `INSERT INTO typing_sessions 
       (user_id, mode, sub_mode, wpm, raw_wpm, accuracy, consistency, time_seconds, error_count, char_breakdown)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        user.id,
        mode || 'speed',
        subMode || '100',
        wpm || 0,
        rawWpm || 0,
        accuracy || 0,
        consistency || 0,
        timeSeconds || 0,
        errorCount || 0,
        JSON.stringify(charBreakdown || {})
      ]
    );

    return res.json({ success: true, user_id: user.id });
  } catch (err) {
    console.warn('[Stats Sync Note]', err.message);
    return res.json({ success: true, fallback: true });
  }
});

// GET /api/stats - Retrieve user session history
router.get('/stats', async (req, res) => {
  const user = req.session?.user;
  if (!user) {
    return res.json({ sessions: [] });
  }

  try {
    const historyRes = await query(
      `SELECT id, mode, sub_mode, wpm, raw_wpm, accuracy, consistency, time_seconds, error_count, created_at
       FROM typing_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.id]
    );
    return res.json({ sessions: historyRes.rows || [] });
  } catch (err) {
    return res.json({ sessions: [] });
  }
});

// GET /api/goals - Fetch user goal benchmarks
router.get('/goals', async (req, res) => {
  const user = req.session?.user;
  if (!user) {
    return res.json({ goals: null });
  }

  try {
    const goalsRes = await query(
      `SELECT daily_minutes as "dailyMinutes",
              weekly_minutes as "weeklyMinutes",
              monthly_minutes as "monthlyMinutes",
              target_wpm_speed as "targetWpmSpeed",
              target_wpm_accuracy as "targetWpmAccuracy",
              target_wpm_code as "targetWpmCode",
              target_accuracy as "targetAccuracy"
       FROM user_goals
       WHERE user_id = $1`,
      [user.id]
    );

    if (goalsRes.rows && goalsRes.rows.length > 0) {
      return res.json({ goals: goalsRes.rows[0] });
    }
    return res.json({ goals: null });
  } catch (err) {
    return res.json({ goals: null });
  }
});

// POST /api/goals - Upsert user goal benchmarks
router.post('/goals', async (req, res) => {
  const user = req.session?.user;
  if (!user) {
    return res.json({ success: true, guest: true });
  }

  const {
    dailyMinutes,
    weeklyMinutes,
    monthlyMinutes,
    targetWpmSpeed,
    targetWpmAccuracy,
    targetWpmCode,
    targetAccuracy
  } = req.body;

  try {
    await query(
      `INSERT INTO user_goals 
       (user_id, daily_minutes, weekly_minutes, monthly_minutes, target_wpm_speed, target_wpm_accuracy, target_wpm_code, target_accuracy, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         daily_minutes = EXCLUDED.daily_minutes,
         weekly_minutes = EXCLUDED.weekly_minutes,
         monthly_minutes = EXCLUDED.monthly_minutes,
         target_wpm_speed = EXCLUDED.target_wpm_speed,
         target_wpm_accuracy = EXCLUDED.target_wpm_accuracy,
         target_wpm_code = EXCLUDED.target_wpm_code,
         target_accuracy = EXCLUDED.target_accuracy,
         updated_at = NOW()`,
      [
        user.id,
        dailyMinutes || 15,
        weeklyMinutes || 75,
        monthlyMinutes || 300,
        targetWpmSpeed || 80,
        targetWpmAccuracy || 60,
        targetWpmCode || 50,
        targetAccuracy || 96
      ]
    );

    return res.json({ success: true });
  } catch (err) {
    console.warn('[Goals Update Note]', err.message);
    return res.json({ success: true, fallback: true });
  }
});

// GET /api/analytics/characters - Retrieve character error analytics
router.get('/analytics/characters', async (req, res) => {
  const user = req.session?.user;
  if (!user) {
    return res.json({ analytics: null });
  }

  try {
    const charRes = await query(
      'SELECT analytics_data FROM character_analytics WHERE user_id = $1',
      [user.id]
    );

    if (charRes.rows && charRes.rows.length > 0) {
      return res.json({ analytics: charRes.rows[0].analytics_data });
    }
    return res.json({ analytics: null });
  } catch (err) {
    return res.json({ analytics: null });
  }
});

// POST /api/analytics/characters - Upsert character analytics
router.post('/analytics/characters', async (req, res) => {
  const user = req.session?.user;
  if (!user) {
    return res.json({ success: true, guest: true });
  }

  const { analytics } = req.body;

  try {
    await query(
      `INSERT INTO character_analytics (user_id, analytics_data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         analytics_data = EXCLUDED.analytics_data,
         updated_at = NOW()`,
      [user.id, JSON.stringify(analytics || {})]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: true, fallback: true });
  }
});

export default router;
