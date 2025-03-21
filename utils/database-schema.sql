-- PostgreSQL Schema for IPL Streaming Website

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams Table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches Table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team1_id UUID REFERENCES teams(id) NOT NULL,
  team2_id UUID REFERENCES teams(id) NOT NULL,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'live', 'completed')),
  result TEXT,
  team1_score TEXT,
  team1_overs TEXT,
  team2_score TEXT,
  team2_overs TEXT,
  highlights_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streams Table
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) NOT NULL,
  stream_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'live', 'ended')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  chat_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stream Quality Options Table
CREATE TABLE stream_qualities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID REFERENCES streams(id) NOT NULL,
  quality_id TEXT NOT NULL,
  quality_name TEXT NOT NULL,
  bitrate TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table (for Admin Access)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Hashed password
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stream Analytics Table
CREATE TABLE stream_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID REFERENCES streams(id) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  average_watch_time INTEGER DEFAULT 0 -- in seconds
);

-- RLS Policies for Security

-- Allow public to read teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public teams are viewable by everyone" ON teams FOR SELECT USING (true);

-- Allow public to read matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public matches are viewable by everyone" ON matches FOR SELECT USING (true);

-- Allow public to read streams
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public streams are viewable by everyone" ON streams FOR SELECT USING (status = 'live');

-- Allow admins to edit all data
CREATE POLICY "Admins can do all operations" ON teams FOR ALL USING (
  auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Similar policies for other tables
