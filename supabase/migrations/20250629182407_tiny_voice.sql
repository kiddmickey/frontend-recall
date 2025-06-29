/*
  # Create memory cards table

  1. New Tables
    - `memory_cards`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patient_profiles)
      - `photo_url` (text) - URL to photo/image
      - `audio_url` (text) - URL to audio recording
      - `date_taken` (date) - When the memory was captured
      - `location` (text) - Where the memory took place
      - `caption` (text) - Description of the memory
      - `people_involved` (text array) - People in the memory
      - `emotional_context` (text) - Emotional significance
      - `is_quick_memory` (boolean) - Whether it's a quick memory entry
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `memory_cards` table
    - Add policy for authenticated users to manage memory cards
*/

CREATE TABLE IF NOT EXISTS memory_cards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patient_profiles(id) ON DELETE CASCADE,
  photo_url text DEFAULT '',
  audio_url text DEFAULT '',
  date_taken date DEFAULT CURRENT_DATE,
  location text DEFAULT '',
  caption text DEFAULT '',
  people_involved text[] DEFAULT '{}',
  emotional_context text DEFAULT '',
  is_quick_memory boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE memory_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on memory_cards"
  ON memory_cards
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_memory_cards_patient_id ON memory_cards(patient_id);
CREATE INDEX IF NOT EXISTS idx_memory_cards_date_taken ON memory_cards(date_taken DESC);