/*
  # Create patient profiles table

  1. New Tables
    - `patient_profiles`
      - `id` (uuid, primary key)
      - `preferred_name` (text, required) - Patient's preferred name
      - `family_relationships` (jsonb) - Family member relationships and details
      - `life_events` (jsonb) - Important life events and milestones
      - `personality_traits` (text array) - Key personality characteristics
      - `medical_notes` (text) - Medical history and notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `patient_profiles` table
    - Add policy for authenticated users to manage patient profiles
*/

-- Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS patient_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  preferred_name text NOT NULL,
  family_relationships jsonb DEFAULT '{}',
  life_events jsonb DEFAULT '{}',
  personality_traits text[] DEFAULT '{}',
  medical_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on patient_profiles"
  ON patient_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);