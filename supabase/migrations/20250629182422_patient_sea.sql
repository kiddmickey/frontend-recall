/*
  # Create transcripts table

  1. New Tables
    - `transcripts`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patient_profiles)
      - `session_id` (uuid, foreign key to sessions)
      - `conversation_id` (text) - External conversation identifier
      - `full_transcript` (text) - Complete transcript text
      - `transcript_segments` (jsonb) - Segmented transcript data
      - `word_count` (integer) - Total word count
      - `duration_seconds` (integer) - Transcript duration
      - `key_topics` (text array) - Identified key topics
      - `memory_references` (text array) - Referenced memories
      - `emotional_indicators` (jsonb) - Emotional analysis data
      - `sentiment_analysis` (jsonb) - Sentiment analysis results
      - `transcript_summary` (text) - AI-generated summary
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `transcripts` table
    - Add policy for authenticated users to manage transcripts
*/

CREATE TABLE IF NOT EXISTS transcripts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patient_profiles(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  conversation_id text DEFAULT '',
  full_transcript text DEFAULT '',
  transcript_segments jsonb DEFAULT '[]',
  word_count integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  key_topics text[] DEFAULT '{}',
  memory_references text[] DEFAULT '{}',
  emotional_indicators jsonb DEFAULT '{}',
  sentiment_analysis jsonb DEFAULT '{}',
  transcript_summary text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on transcripts"
  ON transcripts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transcripts_patient_id ON transcripts(patient_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_conversation_id ON transcripts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at DESC);

-- Create full-text search index for transcript content
CREATE INDEX IF NOT EXISTS idx_transcripts_full_text ON transcripts USING gin(to_tsvector('english', full_transcript));