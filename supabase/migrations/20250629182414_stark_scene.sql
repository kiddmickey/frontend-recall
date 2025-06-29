/*
  # Create sessions table

  1. New Tables
    - `sessions`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patient_profiles)
      - `memory_id` (uuid, foreign key to memory_cards, nullable)
      - `conversation_id` (text) - External conversation identifier
      - `conversation_url` (text) - URL to conversation interface
      - `session_type` (text) - Type of session (conversation, memory_review, etc.)
      - `duration_seconds` (integer) - Session duration in seconds
      - `transcription` (jsonb) - Raw transcription data
      - `status` (text) - Session status (active, completed, etc.)
      - `started_at` (timestamptz) - When session started
      - `ended_at` (timestamptz) - When session ended
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `sessions` table
    - Add policy for authenticated users to manage sessions
*/

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patient_profiles(id) ON DELETE CASCADE,
  memory_id uuid REFERENCES memory_cards(id) ON DELETE SET NULL,
  conversation_id text DEFAULT '',
  conversation_url text DEFAULT '',
  session_type text DEFAULT 'conversation',
  duration_seconds integer DEFAULT 0,
  transcription jsonb DEFAULT '{}',
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on sessions"
  ON sessions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_conversation_id ON sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);