export interface MemoryCard {
  id: string;
  photo_url: string;
  audio_url?: string;
  date_taken: string;
  location?: string;
  caption?: string;
  emotional_context?: string;
  people_involved?: string[];
  created_at: string;
}

export interface PatientProfile {
  id: string;
  preferred_name: string;
  family_relationships: Record<string, string>;
  life_events: LifeEvent[];
  personality_traits: string[];
  medical_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LifeEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  significance: 'high' | 'medium' | 'low';
  people_involved: string[];
}

export interface TavusSession {
  session_id: string;
  replica_id: string;
  status: 'active' | 'ended' | 'error';
  conversation_url?: string;
  created_at: string;
}

export interface ConversationPrompt {
  opening_script: string;
  memory_references: string[];
  emotional_tone: 'warm' | 'gentle' | 'encouraging' | 'nostalgic';
  suggested_topics: string[];
}