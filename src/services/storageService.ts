import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Netlify environment variables.');
  
  // Create a mock client that will show helpful error messages
  const mockClient = {
    from: () => ({
      insert: () => Promise.reject(new Error('Supabase not configured. Please set up environment variables.')),
      select: () => Promise.reject(new Error('Supabase not configured. Please set up environment variables.')),
      update: () => Promise.reject(new Error('Supabase not configured. Please set up environment variables.')),
      delete: () => Promise.reject(new Error('Supabase not configured. Please set up environment variables.')),
      eq: () => Promise.reject(new Error('Supabase not configured. Please set up environment variables.')),
      order: () => Promise.reject(new Error('Supabase not configured. Please set up environment variables.')),
      single: () => Promise.reject(new Error('Supabase not configured. Please set up environment variables.'))
    })
  };
  
  // Export mock client to prevent app crashes
  var supabase = mockClient as any;
} else {
  var supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export class StorageService {
  // Memory Cards
  static async saveMemoryCard(memoryCard: any): Promise<any> {
    const newCard = {
      ...memoryCard,
      id: memoryCard.id || undefined, // Let Supabase generate UUID if not provided
      created_at: memoryCard.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('memory_cards')
      .insert(newCard)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving memory card:', error);
      throw error;
    }
    
    return data;
  }

  static async getMemoryCards(): Promise<any[]> {
    const { data, error } = await supabase
      .from('memory_cards')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching memory cards:', error);
      throw error;
    }
    
    return data || [];
  }

  static async getMemoryCardsByPatient(patientId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('memory_cards')
      .select('*')
      .eq('patient_id', patientId)
      .order('date_taken', { ascending: false });
    
    if (error) {
      console.error('Error fetching memory cards by patient:', error);
      throw error;
    }
    
    return data || [];
  }

  static async deleteMemoryCard(memoryId: string): Promise<void> {
    const { error } = await supabase
      .from('memory_cards')
      .delete()
      .eq('id', memoryId);
    
    if (error) {
      console.error('Error deleting memory card:', error);
      throw error;
    }
  }

  static async updateMemoryCard(memoryId: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('memory_cards')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', memoryId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating memory card:', error);
      throw error;
    }
    
    return data;
  }

  // Patient Profiles
  static async savePatientProfile(profile: any): Promise<any> {
    const profileData = {
      ...profile,
      updated_at: new Date().toISOString()
    };

    // If profile has an ID, update it; otherwise, insert new
    if (profile.id) {
      const { data, error } = await supabase
        .from('patient_profiles')
        .update(profileData)
        .eq('id', profile.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating patient profile:', error);
        throw error;
      }
      
      return data;
    } else {
      const { data, error } = await supabase
        .from('patient_profiles')
        .insert({
          ...profileData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating patient profile:', error);
        throw error;
      }
      
      return data;
    }
  }

  static async getPatientProfiles(): Promise<any[]> {
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching patient profiles:', error);
      throw error;
    }
    
    return data || [];
  }

  static async getPatientProfile(patientId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('id', patientId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching patient profile:', error);
      throw error;
    }
    
    return data;
  }

  static async deletePatientProfile(patientId: string): Promise<void> {
    // Delete associated data first (cascading deletes should handle this, but being explicit)
    await Promise.all([
      supabase.from('transcripts').delete().eq('patient_id', patientId),
      supabase.from('sessions').delete().eq('patient_id', patientId),
      supabase.from('memory_cards').delete().eq('patient_id', patientId)
    ]);

    // Delete the patient profile
    const { error } = await supabase
      .from('patient_profiles')
      .delete()
      .eq('id', patientId);
    
    if (error) {
      console.error('Error deleting patient profile:', error);
      throw error;
    }
  }

  // Sessions
  static async saveSession(session: any): Promise<any> {
    const sessionData = {
      ...session,
      created_at: session.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving session:', error);
      throw error;
    }
    
    return data;
  }

  static async getSessions(): Promise<any[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
    
    return data || [];
  }

  static async getSessionsByPatient(patientId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching sessions by patient:', error);
      throw error;
    }
    
    return data || [];
  }

  static async updateSession(sessionId: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating session:', error);
      throw error;
    }
    
    return data;
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);
    
    if (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  // Transcripts
  static async saveTranscript(transcript: any): Promise<any> {
    const transcriptData = {
      ...transcript,
      created_at: transcript.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('transcripts')
      .insert(transcriptData)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving transcript:', error);
      throw error;
    }
    
    return data;
  }

  static async getTranscripts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('transcripts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching transcripts:', error);
      throw error;
    }
    
    return data || [];
  }

  static async getTranscriptsByPatient(patientId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('transcripts')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching transcripts by patient:', error);
      throw error;
    }
    
    return data || [];
  }

  static async getTranscriptsBySession(sessionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('transcripts')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching transcripts by session:', error);
      throw error;
    }
    
    return data || [];
  }

  static async getTranscriptByConversationId(conversationId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('transcripts')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching transcript by conversation ID:', error);
      throw error;
    }
    
    return data;
  }

  static async updateTranscript(transcriptId: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('transcripts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', transcriptId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating transcript:', error);
      throw error;
    }
    
    return data;
  }

  static async deleteTranscript(transcriptId: string): Promise<void> {
    const { error } = await supabase
      .from('transcripts')
      .delete()
      .eq('id', transcriptId);
    
    if (error) {
      console.error('Error deleting transcript:', error);
      throw error;
    }
  }

  // Analytics and Search
  static async searchTranscripts(patientId: string, searchTerm: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('transcripts')
      .select('*')
      .eq('patient_id', patientId)
      .ilike('full_transcript', `%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error searching transcripts:', error);
      throw error;
    }
    
    return data || [];
  }

  static async getTranscriptsByTopic(patientId: string, topic: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('transcripts')
      .select('*')
      .eq('patient_id', patientId)
      .contains('key_topics', [topic])
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching transcripts by topic:', error);
      throw error;
    }
    
    return data || [];
  }

  static async getPatientStats(patientId: string): Promise<any> {
    try {
      const [memories, sessions, transcripts] = await Promise.all([
        this.getMemoryCardsByPatient(patientId),
        this.getSessionsByPatient(patientId),
        this.getTranscriptsByPatient(patientId)
      ]);

      const totalDuration = sessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0);
      const totalWords = transcripts.reduce((sum, transcript) => sum + (transcript.word_count || 0), 0);
      
      // Get all unique topics
      const allTopics = transcripts.flatMap(t => t.key_topics || []);
      const uniqueTopics = [...new Set(allTopics)];
      
      return {
        memoryCount: memories.length,
        sessionCount: sessions.length,
        transcriptCount: transcripts.length,
        totalDurationSeconds: totalDuration,
        totalWords: totalWords,
        uniqueTopics: uniqueTopics,
        averageSessionDuration: sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0,
        averageWordsPerSession: sessions.length > 0 ? Math.round(totalWords / sessions.length) : 0
      };
    } catch (error) {
      console.error('Error getting patient stats:', error);
      throw error;
    }
  }

  // Utility methods for data migration (if needed)
  static async migrateFromLocalStorage(): Promise<void> {
    try {
      // Get data from localStorage
      const localMemories = JSON.parse(localStorage.getItem('family_memories_cards') || '[]');
      const localProfiles = JSON.parse(localStorage.getItem('family_memories_patients') || '[]');
      const localSessions = JSON.parse(localStorage.getItem('family_memories_sessions') || '[]');
      const localTranscripts = JSON.parse(localStorage.getItem('family_memories_transcripts') || '[]');

      // Migrate profiles first (they're referenced by other tables)
      for (const profile of localProfiles) {
        await this.savePatientProfile(profile);
      }

      // Migrate memories
      for (const memory of localMemories) {
        await this.saveMemoryCard(memory);
      }

      // Migrate sessions
      for (const session of localSessions) {
        await this.saveSession(session);
      }

      // Migrate transcripts
      for (const transcript of localTranscripts) {
        await this.saveTranscript(transcript);
      }

      console.log('Data migration from localStorage completed successfully');
    } catch (error) {
      console.error('Error migrating data from localStorage:', error);
      throw error;
    }
  }

  // Clear all data (for testing/development)
  static async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        supabase.from('transcripts').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('memory_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('patient_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      ]);
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}