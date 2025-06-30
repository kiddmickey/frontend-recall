import { StorageService } from './storageService';

export interface QuizQuestion {
  id: string;
  memoryId: string;
  imageUrl: string;
  question: string;
  options: string[];
  correctAnswer: number;
  memoryContext: {
    date: string;
    location?: string;
    peopleInvolved?: string[];
    caption?: string;
  };
}

export class QuizService {
  static async generateQuizFromMemories(patientId: string): Promise<QuizQuestion[]> {
    try {
      const memories = await StorageService.getMemoryCardsByPatient(patientId);
      
      if (memories.length === 0) {
        return [];
      }

      // Filter memories that have photos and sufficient data for quiz questions
      const validMemories = memories.filter(memory => 
        memory.photo_url && 
        (memory.people_involved?.length > 0 || memory.location || memory.date_taken)
      );

      // Generate quiz questions for up to 5 memories
      const quizQuestions: QuizQuestion[] = [];
      const selectedMemories = validMemories.slice(0, 5);

      for (let i = 0; i < selectedMemories.length; i++) {
        const memory = selectedMemories[i];
        const question = this.generateQuestionForMemory(memory, i + 1);
        if (question) {
          quizQuestions.push(question);
        }
      }

      return quizQuestions;
    } catch (error) {
      console.error('Error generating quiz from memories:', error);
      return [];
    }
  }

  private static generateQuestionForMemory(memory: any, questionNumber: number): QuizQuestion | null {
    const questionTypes = [];

    // Add question types based on available data
    if (memory.people_involved?.length > 0) {
      questionTypes.push('people');
    }
    if (memory.location) {
      questionTypes.push('location');
    }
    if (memory.date_taken) {
      questionTypes.push('date');
    }
    if (memory.emotional_context) {
      questionTypes.push('emotion');
    }

    if (questionTypes.length === 0) {
      return null;
    }

    // Randomly select a question type
    const selectedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    return this.createQuestionByType(memory, selectedType, questionNumber);
  }

  private static createQuestionByType(memory: any, type: string, questionNumber: number): QuizQuestion {
    const baseQuestion: Partial<QuizQuestion> = {
      id: `quiz_${memory.id}_${questionNumber}`,
      memoryId: memory.id,
      imageUrl: memory.photo_url,
      memoryContext: {
        date: memory.date_taken,
        location: memory.location,
        peopleInvolved: memory.people_involved || [],
        caption: memory.caption
      }
    };

    switch (type) {
      case 'people':
        return {
          ...baseQuestion,
          question: "Who can you see in this photo?",
          options: this.generatePeopleOptions(memory.people_involved),
          correctAnswer: 0
        } as QuizQuestion;

      case 'location':
        return {
          ...baseQuestion,
          question: "Where was this photo taken?",
          options: this.generateLocationOptions(memory.location),
          correctAnswer: 0
        } as QuizQuestion;

      case 'date':
        return {
          ...baseQuestion,
          question: "When was this photo taken?",
          options: this.generateDateOptions(memory.date_taken),
          correctAnswer: 0
        } as QuizQuestion;

      case 'emotion':
        return {
          ...baseQuestion,
          question: "What was the mood of this moment?",
          options: this.generateEmotionOptions(memory.emotional_context),
          correctAnswer: 0
        } as QuizQuestion;

      default:
        return {
          ...baseQuestion,
          question: "What do you remember about this moment?",
          options: ["It was a special day", "It was an ordinary day", "I'm not sure", "It was challenging"],
          correctAnswer: 0
        } as QuizQuestion;
    }
  }

  private static generatePeopleOptions(correctPeople: string[]): string[] {
    const options = [correctPeople.join(', ')];
    
    // Add some plausible wrong answers
    const commonNames = ['Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'John', 'Mary', 'Robert'];
    const wrongOptions = [
      commonNames.slice(0, 2).join(', '),
      commonNames.slice(2, 4).join(', '),
      "Family friends"
    ];

    options.push(...wrongOptions.slice(0, 3));
    return this.shuffleArray(options).slice(0, 4);
  }

  private static generateLocationOptions(correctLocation: string): string[] {
    const options = [correctLocation];
    
    const commonLocations = [
      "At home", "In the garden", "At the park", "Downtown", 
      "At the beach", "In the kitchen", "At church", "At a restaurant"
    ];
    
    const wrongOptions = commonLocations.filter(loc => 
      loc.toLowerCase() !== correctLocation.toLowerCase()
    ).slice(0, 3);

    options.push(...wrongOptions);
    return this.shuffleArray(options).slice(0, 4);
  }

  private static generateDateOptions(correctDate: string): string[] {
    const date = new Date(correctDate);
    const year = date.getFullYear();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    
    const options = [`${month} ${year}`];
    
    // Generate nearby years
    const wrongYears = [year - 1, year + 1, year - 2].map(y => `${month} ${y}`);
    options.push(...wrongYears);
    
    return this.shuffleArray(options).slice(0, 4);
  }

  private static generateEmotionOptions(correctEmotion: string): string[] {
    const emotionMap: { [key: string]: string } = {
      'joyful': 'Joyful & Happy',
      'peaceful': 'Peaceful & Calm',
      'celebratory': 'Celebratory & Festive',
      'nostalgic': 'Nostalgic & Reflective',
      'loving': 'Loving & Tender',
      'proud': 'Proud & Accomplished',
      'adventurous': 'Adventurous & Exciting',
      'cozy': 'Cozy & Intimate'
    };

    const correctDisplay = emotionMap[correctEmotion] || correctEmotion;
    const options = [correctDisplay];
    
    const otherEmotions = Object.values(emotionMap).filter(e => e !== correctDisplay);
    options.push(...otherEmotions.slice(0, 3));
    
    return this.shuffleArray(options).slice(0, 4);
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static generateAvatarResponse(isCorrect: boolean, question: QuizQuestion, selectedAnswer: string): string {
    const { memoryContext } = question;
    
    if (isCorrect) {
      const encouragements = [
        "Exactly right! You remembered perfectly!",
        "That's absolutely correct! Your memory is wonderful!",
        "Perfect! You got it exactly right!",
        "Wonderful! You remembered that beautifully!",
        "Yes, that's exactly right! Well done!"
      ];
      
      const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
      
      // Add specific context about the memory
      let context = "";
      if (memoryContext.location) {
        context += ` That was such a lovely time at ${memoryContext.location}.`;
      }
      if (memoryContext.peopleInvolved?.length > 0) {
        context += ` It's wonderful how you remember being with ${memoryContext.peopleInvolved.join(' and ')}.`;
      }
      
      return `${encouragement}${context} These memories are so precious, aren't they?`;
    } else {
      const corrections = [
        "That's a good guess, but actually",
        "Close, but let me help you remember -",
        "Almost there! Actually,",
        "Good try! The correct answer is",
        "Not quite, but that's okay -"
      ];
      
      const correction = corrections[Math.floor(Math.random() * corrections.length)];
      
      // Provide the correct answer with context
      let correctInfo = "";
      if (question.question.includes("Who")) {
        correctInfo = `it was ${memoryContext.peopleInvolved?.join(' and ')}`;
      } else if (question.question.includes("Where")) {
        correctInfo = `this was taken at ${memoryContext.location}`;
      } else if (question.question.includes("When")) {
        const date = new Date(memoryContext.date);
        correctInfo = `this was in ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
      }
      
      return `${correction} ${correctInfo}. But don't worry - remembering can be challenging sometimes, and that's perfectly normal. What matters is that we're sharing these beautiful moments together!`;
    }
  }
}