/*
  # Complete Database Schema Setup

  1. New Tables
    - `patient_profiles` - Store patient information and preferences
    - `memory_cards` - Store photos, audio, and memory details
    - `sessions` - Track conversation sessions with Tavus
    - `transcripts` - Store conversation transcripts and analysis

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access all data

  3. Performance
    - Add indexes for common query patterns
    - Full-text search index for transcripts
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create patient_profiles table
CREATE TABLE IF NOT EXISTS patient_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  preferred_name text NOT NULL,
  family_relationships jsonb DEFAULT '{}'::jsonb,
  life_events jsonb DEFAULT '{}'::jsonb,
  personality_traits text[] DEFAULT '{}'::text[],
  medical_notes text DEFAULT ''::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create memory_cards table
CREATE TABLE IF NOT EXISTS memory_cards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patient_profiles(id) ON DELETE CASCADE,
  photo_url text DEFAULT ''::text,
  audio_url text DEFAULT ''::text,
  date_taken date DEFAULT CURRENT_DATE,
  location text DEFAULT ''::text,
  caption text DEFAULT ''::text,
  people_involved text[] DEFAULT '{}'::text[],
  emotional_context text DEFAULT ''::text,
  is_quick_memory boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patient_profiles(id) ON DELETE CASCADE,
  memory_id uuid REFERENCES memory_cards(id) ON DELETE SET NULL,
  conversation_id text DEFAULT ''::text,
  conversation_url text DEFAULT ''::text,
  session_type text DEFAULT 'conversation'::text,
  duration_seconds integer DEFAULT 0,
  transcription jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active'::text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patient_profiles(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  conversation_id text DEFAULT ''::text,
  full_transcript text DEFAULT ''::text,
  transcript_segments jsonb DEFAULT '[]'::jsonb,
  word_count integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  key_topics text[] DEFAULT '{}'::text[],
  memory_references text[] DEFAULT '{}'::text[],
  emotional_indicators jsonb DEFAULT '{}'::jsonb,
  sentiment_analysis jsonb DEFAULT '{}'::jsonb,
  transcript_summary text DEFAULT ''::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memory_cards_patient_id ON memory_cards(patient_id);
CREATE INDEX IF NOT EXISTS idx_memory_cards_date_taken ON memory_cards(date_taken DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_conversation_id ON sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transcripts_patient_id ON transcripts(patient_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_conversation_id ON transcripts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcripts_full_text ON transcripts USING gin(to_tsvector('english', full_transcript));

-- Enable Row Level Security
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Allow all operations on patient_profiles" ON patient_profiles;
DROP POLICY IF EXISTS "Allow all operations on memory_cards" ON memory_cards;
DROP POLICY IF EXISTS "Allow all operations on sessions" ON sessions;
DROP POLICY IF EXISTS "Allow all operations on transcripts" ON transcripts;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow all operations on patient_profiles"
  ON patient_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on memory_cards"
  ON memory_cards
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on sessions"
  ON sessions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on transcripts"
  ON transcripts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);