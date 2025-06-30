const TAVUS_API_KEY = '829f44be964342748e0cd324eaf57fee';
const REPLICA_ID = 'r93183fb36c0';
const PERSONA_ID = 'pe783f201c13';
const TAVUS_BASE_URL = '/tavusapi';

export class TavusService {
  private apiKey: string;
  private replicaId: string;
  private personaId: string;

  constructor() {
    this.apiKey = TAVUS_API_KEY;
    this.replicaId = REPLICA_ID;
    this.personaId = PERSONA_ID;
  }

  async createConversation(conversationPrompt: string, patientName: string): Promise<any> {
    try {
      const response = await fetch(`${TAVUS_BASE_URL}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          replica_id: this.replicaId,
          persona_id: this.personaId,
          conversation_name: `A Conversation with My AI Memory Guide - ${patientName}`,
          conversational_context: conversationPrompt,
          custom_greeting: "Hey there! It's so good to see you again. Let's go through some lovely memories together.",
          properties: {
            max_call_duration: 3600,
            participant_left_timeout: 60,
            participant_absent_timeout: 300,
            enable_recording: true,
            enable_closed_captions: true,
            apply_greenscreen: true,
            language: "english",
            recording_s3_bucket_name: "conversation-recordings",
            recording_s3_bucket_region: "us-east-1",
            aws_assume_role_arn: ""
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Tavus API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      // Expected response format:
      // {
      //   "conversation_id": "c123456",
      //   "conversation_name": "A Conversation with My AI Memory Guide",
      //   "status": "active",
      //   "conversation_url": "https://tavus.daily.co/c123456",
      //   "replica_id": "r93183fb36c0",
      //   "persona_id": "pe783f201c13",
      //   "created_at": "2025-06-29T12:34:56Z"
      // }
      
      return data;
    } catch (error) {
      console.error('Error creating Tavus conversation:', error);
      throw error;
    }
  }

  async getConversationStatus(conversationId: string): Promise<any> {
    try {
      const response = await fetch(`${TAVUS_BASE_URL}/conversations/${conversationId}`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting conversation status:', error);
      throw error;
    }
  }

  async getConversationTranscript(conversationId: string): Promise<any> {
    try {
      const response = await fetch(`${TAVUS_BASE_URL}/conversations/${conversationId}/transcripts`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting conversation transcript:', error);
      throw error;
    }
  }

  async endConversation(conversationId: string): Promise<void> {
    try {
      await fetch(`${TAVUS_BASE_URL}/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
        },
      });
    } catch (error) {
      console.error('Error ending conversation:', error);
      throw error;
    }
  }

  // Process and analyze transcript data
  processTranscriptData(rawTranscript: any): any {
    if (!rawTranscript || !rawTranscript.segments) {
      return {
        full_transcript: '',
        transcript_segments: [],
        word_count: 0,
        duration_seconds: 0,
        key_topics: [],
        memory_references: [],
        emotional_indicators: {}
      };
    }

    const segments = rawTranscript.segments || [];
    const fullTranscript = segments
      .map((segment: any) => `[${this.formatTimestamp(segment.start)}] ${segment.speaker}: ${segment.text}`)
      .join('\n');

    const wordCount = segments.reduce((count: number, segment: any) => {
      return count + (segment.text ? segment.text.split(' ').length : 0);
    }, 0);

    const duration = segments.length > 0 ? 
      Math.max(...segments.map((s: any) => s.end || 0)) : 0;

    // Extract key topics and memory references
    const keyTopics = this.extractKeyTopics(fullTranscript);
    const memoryReferences = this.extractMemoryReferences(fullTranscript);
    const emotionalIndicators = this.analyzeEmotionalContent(fullTranscript);

    return {
      full_transcript: fullTranscript,
      transcript_segments: segments.map((segment: any) => ({
        start: segment.start,
        end: segment.end,
        speaker: segment.speaker,
        text: segment.text,
        confidence: segment.confidence || 1.0
      })),
      word_count: wordCount,
      duration_seconds: Math.round(duration),
      key_topics: keyTopics,
      memory_references: memoryReferences,
      emotional_indicators: emotionalIndicators
    };
  }

  private formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private extractKeyTopics(transcript: string): string[] {
    const topics: string[] = [];
    const topicKeywords = [
      'family', 'children', 'grandchildren', 'spouse', 'husband', 'wife',
      'birthday', 'anniversary', 'holiday', 'christmas', 'thanksgiving',
      'vacation', 'travel', 'home', 'garden', 'cooking', 'recipe',
      'work', 'career', 'retirement', 'school', 'education',
      'health', 'doctor', 'medicine', 'hospital',
      'friends', 'neighbors', 'community', 'church',
      'mood', 'sleep', 'energy', 'appetite', 'social', 'activities', 'comfort', 'memory'
    ];

    const lowerTranscript = transcript.toLowerCase();
    topicKeywords.forEach(keyword => {
      if (lowerTranscript.includes(keyword)) {
        topics.push(keyword);
      }
    });

    return [...new Set(topics)]; // Remove duplicates
  }

  private extractMemoryReferences(transcript: string): string[] {
    const memoryReferences: string[] = [];
    const memoryPatterns = [
      /remember when/gi,
      /back in \d{4}/gi,
      /years ago/gi,
      /when I was/gi,
      /used to/gi,
      /in the old days/gi
    ];

    memoryPatterns.forEach(pattern => {
      const matches = transcript.match(pattern);
      if (matches) {
        memoryReferences.push(...matches);
      }
    });

    return memoryReferences;
  }

  private analyzeEmotionalContent(transcript: string): any {
    const emotions = {
      positive: 0,
      negative: 0,
      neutral: 0,
      indicators: []
    };

    const positiveWords = ['happy', 'joy', 'love', 'wonderful', 'beautiful', 'amazing', 'grateful', 'blessed'];
    const negativeWords = ['sad', 'worried', 'afraid', 'lonely', 'confused', 'frustrated', 'angry', 'upset'];

    const lowerTranscript = transcript.toLowerCase();
    
    positiveWords.forEach(word => {
      const count = (lowerTranscript.match(new RegExp(word, 'g')) || []).length;
      emotions.positive += count;
      if (count > 0) emotions.indicators.push({ type: 'positive', word, count });
    });

    negativeWords.forEach(word => {
      const count = (lowerTranscript.match(new RegExp(word, 'g')) || []).length;
      emotions.negative += count;
      if (count > 0) emotions.indicators.push({ type: 'negative', word, count });
    });

    const totalWords = transcript.split(' ').length;
    emotions.neutral = Math.max(0, totalWords - emotions.positive - emotions.negative);

    return emotions;
  }

  generateConversationPrompt(
    patientProfile: any,
    memoryCards: any[],
    selectedMemory?: any
  ): string {
    const { preferred_name, family_relationships, personality_traits } = patientProfile;
    
    let prompt = `You are a gentle, cheerful, and familiar AI companion helping ${preferred_name} with Alzheimer's recall beautiful life memories. Offer emotional support and ask reflective, lighthearted questions. `;
    
    // Add personality context
    if (personality_traits?.length > 0) {
      prompt += `They are known for being ${personality_traits.join(', ')}. `;
    }

    // Add family context
    const familyContext = Object.entries(family_relationships || {})
      .map(([relation, name]) => `${name} is their ${relation}`)
      .join(', ');
    
    if (familyContext) {
      prompt += `Important family members include: ${familyContext}. `;
    }

    // Add specific memory context if provided
    if (selectedMemory) {
      prompt += `Today's conversation should focus on a special memory from ${selectedMemory.date_taken}`;
      if (selectedMemory.location) {
        prompt += ` at ${selectedMemory.location}`;
      }
      prompt += `. ${selectedMemory.caption || 'This was a meaningful moment in their life.'}`;
      
      if (selectedMemory.people_involved?.length > 0) {
        prompt += ` People who were there included: ${selectedMemory.people_involved.join(', ')}.`;
      }
    }

    // Add general memory context
    if (memoryCards?.length > 0) {
      prompt += ` Other cherished memories include moments from ${memoryCards
        .slice(0, 3)
        .map(m => m.location || m.date_taken)
        .join(', ')}.`;
    }

    prompt += ` Please speak warmly and naturally, as if you're a caring family member who knows them well. Ask gentle questions about their day, their feelings, and help them recall happy memories. Be patient, encouraging, and emotionally supportive.`;

    return prompt;
  }

  generateEmotionalCheckInPrompt(
    patientProfile: any,
    checkInData: any,
    memoryCards: any[]
  ): string {
    const { preferred_name, family_relationships, personality_traits } = patientProfile;
    const { focus_areas, custom_message, urgency_level } = checkInData;
    
    let prompt = `You are a gentle, cheerful, and familiar AI companion conducting an emotional check-in with ${preferred_name}, who has Alzheimer's. Offer emotional support and ask reflective, lighthearted questions. `;
    
    // Add personality context
    if (personality_traits?.length > 0) {
      prompt += `They are known for being ${personality_traits.join(', ')}. `;
    }

    // Add family context
    const familyContext = Object.entries(family_relationships || {})
      .map(([relation, name]) => `${name} is their ${relation}`)
      .join(', ');
    
    if (familyContext) {
      prompt += `Important family members include: ${familyContext}. `;
    }

    // Add urgency level guidance
    if (urgency_level === 'gentle') {
      prompt += `Please be extra patient and sensitive in your approach. Take your time with questions and allow for pauses. `;
    } else if (urgency_level === 'watch_closely') {
      prompt += `Please be particularly attentive to their responses and emotional state. Watch for any signs of distress or concerning changes. `;
    } else {
      prompt += `Maintain a warm, caring tone throughout the conversation. `;
    }

    // Add focus areas
    prompt += `Today's check-in should gently explore these areas: ${focus_areas.join(', ')}. `;

    // Add custom caregiver message if provided
    if (custom_message) {
      prompt += `The caregiver has shared this important context: "${custom_message}". Please weave this information naturally into your conversation. `;
    }

    // Add conversation guidance based on focus areas
    const focusGuidance = {
      mood: "Ask open-ended questions about how they're feeling today, what's on their mind, and if anything is bothering them.",
      sleep: "Gently inquire about their sleep quality, whether they slept well, and if they feel rested.",
      energy: "Ask about their energy levels, whether they feel tired or energetic, and how they're feeling physically.",
      appetite: "Check in about their interest in food, whether they've been eating well, and if they've enjoyed their meals.",
      social: "Ask about connections with family and friends, recent visits or calls, and how they're feeling about social interactions.",
      activities: "Inquire about their daily activities, hobbies they've enjoyed, and things that have brought them joy recently.",
      comfort: "Gently ask about any physical discomfort, pain, or how they're feeling in their body.",
      memory: "Check in about their mental clarity, if they've been remembering things well, and how they're feeling cognitively."
    };

    const selectedGuidance = focus_areas
      .filter(area => focusGuidance[area])
      .map(area => focusGuidance[area])
      .join(' ');

    if (selectedGuidance) {
      prompt += `Conversation guidance: ${selectedGuidance} `;
    }

    // Add memory context for comfort
    if (memoryCards?.length > 0) {
      prompt += `You can reference their cherished memories from ${memoryCards
        .slice(0, 2)
        .map(m => m.location || m.date_taken)
        .join(' and ')} to help them feel comfortable and connected. `;
    }

    prompt += `Remember to be emotionally supportive, non-judgmental, and create a safe space for them to share their feelings. Use open-ended questions, validate their emotions, and offer gentle encouragement. If they seem reluctant to talk about something, don't push - simply let them know you're there for them.`;

    return prompt;
  }
}

export const tavusService = new TavusService();