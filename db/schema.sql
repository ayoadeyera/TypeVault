-- ============================================================================
-- Type Station - PostgreSQL Database Schema
-- A Product of PluralTech LTD
-- ============================================================================

-- Ensure uuid-ossp extension is enabled if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Typing Sessions Table (History & Results)
CREATE TABLE IF NOT EXISTS typing_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  mode VARCHAR(50) NOT NULL DEFAULT 'speed',
  sub_mode VARCHAR(50) NOT NULL DEFAULT '100',
  wpm NUMERIC(6, 2) NOT NULL,
  raw_wpm NUMERIC(6, 2) NOT NULL,
  accuracy NUMERIC(5, 2) NOT NULL,
  consistency NUMERIC(5, 2) DEFAULT 0,
  time_seconds NUMERIC(6, 2) NOT NULL,
  error_count INTEGER DEFAULT 0,
  char_breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Goal Benchmarks Table
CREATE TABLE IF NOT EXISTS user_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  daily_minutes INTEGER DEFAULT 15,
  weekly_minutes INTEGER DEFAULT 75,
  monthly_minutes INTEGER DEFAULT 300,
  target_wpm_speed INTEGER DEFAULT 80,
  target_wpm_accuracy INTEGER DEFAULT 60,
  target_wpm_code INTEGER DEFAULT 45,
  target_accuracy INTEGER DEFAULT 96,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Character Analytics & Error Tracking
CREATE TABLE IF NOT EXISTS character_analytics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  analytics_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Contact Inquiries & Feedback Messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'unread',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_typing_sessions_user_id ON typing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_sessions_created_at ON typing_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
