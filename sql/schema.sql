-- Portfolio Database Schema (Neon Postgres)
-- Run this in Neon SQL Editor first

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings (single row, id=1)
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title TEXT NOT NULL DEFAULT 'Portfolio',
  description TEXT DEFAULT '',
  lang TEXT DEFAULT 'bn',
  footer_text TEXT DEFAULT '',
  primary_color TEXT DEFAULT '#7c3aed',
  secondary_color TEXT DEFAULT '#a855f7',
  accent_color TEXT DEFAULT '#c084fc',
  background_color TEXT DEFAULT '#0a0015',
  surface_color TEXT DEFAULT '#1a0030',
  font_family TEXT DEFAULT '''Hind Siliguri'', ''Poppins'', sans-serif',
  glass_effect BOOLEAN DEFAULT true,
  glass_opacity REAL DEFAULT 0.03,
  rain_effect BOOLEAN DEFAULT true,
  rain_drop_count INTEGER DEFAULT 100,
  music_enabled BOOLEAN DEFAULT false,
  music_volume REAL DEFAULT 0.25,
  music_shake BOOLEAN DEFAULT true,
  music_tracks JSONB DEFAULT '[]'::jsonb,
  contact_form_enabled BOOLEAN DEFAULT true,
  contact_success_msg TEXT DEFAULT 'মেসেজ সফলভাবে পাঠানো হয়েছে!',
  contact_error_msg TEXT DEFAULT 'মেসেজ পাঠাতে ব্যর্থ হয়েছে।',
  contact_button_text TEXT DEFAULT 'মেসেজ পাঠান',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile (single row)
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT NOT NULL,
  profession TEXT DEFAULT '',
  education TEXT DEFAULT '',
  field TEXT DEFAULT '',
  goal TEXT DEFAULT '',
  passion TEXT DEFAULT '',
  location TEXT DEFAULT '',
  college TEXT DEFAULT '',
  department TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  freefire TEXT DEFAULT '',
  profile_images JSONB DEFAULT '[]'::jsonb,
  freefire_bg TEXT DEFAULT '',
  profile_details JSONB DEFAULT '[]'::jsonb,
  about_items JSONB DEFAULT '[]'::jsonb,
  hobbies JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 50 CHECK (level >= 0 AND level <= 100),
  icon TEXT DEFAULT 'fa-code',
  category TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects / Tools
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'fa-code',
  link TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  tech_stack JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social links
CREATE TABLE IF NOT EXISTS social_links (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT DEFAULT 'fa-link',
  color TEXT DEFAULT '#888888',
  sort_order INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true
);

-- Navigation
CREATE TABLE IF NOT EXISTS navigation (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT DEFAULT 'fa-circle',
  section TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true
);

-- Contact messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  message TEXT NOT NULL,
  social_link TEXT DEFAULT '',
  meta JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (optional simple token store)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_order ON skills(sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(sort_order);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON admin_sessions(token_hash);
