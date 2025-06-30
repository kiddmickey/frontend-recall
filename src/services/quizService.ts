import { StorageService } from './storageService';

export interface QuizQuestion {
  id: string;
  memoryId: string;
  memory: any;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'people' | 'places' | 'dates' | 'events' | 'details';
}

export class QuizService {
  static generateQuestionsFromMemories(memories: any[]): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    
    memories.forEach((memory, index) => {
      // Generate multiple questions per memory
      const memoryQuestions = this.generateMemoryQuestions(memory);
      questions.push(...memoryQuestions);
    });

    // Shuffle and limit questions
    return this.shuffleArray(questions).slice(0, Math.min(10, questions.length));
  }

  private static generateMemoryQuestions(memory: any): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    const baseId = memory.id;

    // Date-based questions
    if (memory.date_taken) {
      const year = new Date(memory.date_taken).getFullYear();
      const month = new Date(memory.date_taken).toLocaleDateString('en-US', { month: 'long' });
      
      questions.push({
        id: `${baseId}_date_year`,
        memoryId: memory.id,
        memory,
        question: "What year was this photo taken?",
        options: this.generateYearOptions(year),
        correctAnswer: year.toString(),
        difficulty: 'medium',
        category: 'dates'
      });

      questions.push({
        id: `${baseId}_date_month`,
        memoryId: memory.id,
        memory,
        question: "In which month was this photo taken?",
        options: this.generateMonthOptions(month),
        correctAnswer: month,
        difficulty: 'easy',
        category: 'dates'
      });
    }

    // Location-based questions
    if (memory.location) {
      questions.push({
        id: `${baseId}_location`,
        memoryId: memory.id,
        memory,
        question: "Where was this photo taken?",
        options: this.generateLocationOptions(memory.location),
        correctAnswer: memory.location,
        difficulty: 'easy',
        category: 'places'
      });
    }

    // People-based questions
    if (memory.people_involved?.length > 0) {
      const randomPerson = memory.people_involved[Math.floor(Math.random() * memory.people_involved.length)];
      
      questions.push({
        id: `${baseId}_people`,
        memoryId: memory.id,
        memory,
        question: "Who was in this photo?",
        options: this.generatePeopleOptions(randomPerson),
        correctAnswer: randomPerson,
        difficulty: 'easy',
        category: 'people'
      });

      if (memory.people_involved.length > 1) {
        questions.push({
          id: `${baseId}_people_count`,
          memoryId: memory.id,
          memory,
          question: "How many people were in this photo?",
          options: this.generateCountOptions(memory.people_involved.length),
          correctAnswer: memory.people_involved.length.toString(),
          difficulty: 'medium',
          category: 'details'
        });
      }
    }

    // Emotional context questions
    if (memory.emotional_context) {
      questions.push({
        id: `${baseId}_emotion`,
        memoryId: memory.id,
        memory,
        question: "What was the mood of this memory?",
        options: this.generateEmotionOptions(memory.emotional_context),
        correctAnswer: this.formatEmotionalContext(memory.emotional_context),
        difficulty: 'medium',
        category: 'events'
      });
    }

    // Caption-based questions
    if (memory.caption) {
      const captionWords = memory.caption.split(' ');
      if (captionWords.length > 5) {
        const keyWord = this.extractKeyWordFromCaption(memory.caption);
        if (keyWord) {
          questions.push({
            id: `${baseId}_caption`,
            memoryId: memory.id,
            memory,
            question: "What was special about this moment?",
            options: this.generateCaptionOptions(keyWord),
            correctAnswer: keyWord,
            difficulty: 'hard',
            category: 'events'
          });
        }
      }
    }

    return questions;
  }

  private static generateYearOptions(correctYear: number): string[] {
    const options = [correctYear.toString()];
    const variations = [-1, -2, 1, 2, -3, 3];
    
    for (let i = 0; i < 3; i++) {
      const variation = variations[Math.floor(Math.random() * variations.length)];
      const wrongYear = correctYear + variation;
      if (!options.includes(wrongYear.toString()) && wrongYear > 1900 && wrongYear <= new Date().getFullYear()) {
        options.push(wrongYear.toString());
      }
    }

    return this.shuffleArray(options).slice(0, 4);
  }

  private static generateMonthOptions(correctMonth: string): string[] {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const options = [correctMonth];
    const otherMonths = months.filter(m => m !== correctMonth);
    
    while (options.length < 4 && otherMonths.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherMonths.length);
      options.push(otherMonths.splice(randomIndex, 1)[0]);
    }

    return this.shuffleArray(options);
  }

  private static generateLocationOptions(correctLocation: string): string[] {
    const commonLocations = [
      'Home', 'Park', 'Beach', 'Restaurant', 'Church', 'School', 
      'Hospital', 'Garden', 'Kitchen', 'Living Room', 'Backyard',
      'Downtown', 'Mall', 'Library', 'Museum', 'Theater'
    ];
    
    const options = [correctLocation];
    const otherLocations = commonLocations.filter(loc => 
      loc.toLowerCase() !== correctLocation.toLowerCase()
    );
    
    while (options.length < 4 && otherLocations.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherLocations.length);
      options.push(otherLocations.splice(randomIndex, 1)[0]);
    }

    return this.shuffleArray(options);
  }

  private static generatePeopleOptions(correctPerson: string): string[] {
    const commonNames = [
      'Sarah', 'Michael', 'Jennifer', 'David', 'Lisa', 'Robert',
      'Mary', 'John', 'Patricia', 'James', 'Linda', 'William',
      'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas'
    ];
    
    const options = [correctPerson];
    const otherNames = commonNames.filter(name => 
      name.toLowerCase() !== correctPerson.toLowerCase()
    );
    
    while (options.length < 4 && otherNames.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherNames.length);
      options.push(otherNames.splice(randomIndex, 1)[0]);
    }

    return this.shuffleArray(options);
  }

  private static generateCountOptions(correctCount: number): string[] {
    const options = [correctCount.toString()];
    const variations = [correctCount - 1, correctCount + 1, correctCount - 2, correctCount + 2];
    
    variations.forEach(variation => {
      if (variation > 0 && variation !== correctCount && !options.includes(variation.toString())) {
        options.push(variation.toString());
      }
    });

    return this.shuffleArray(options).slice(0, 4);
  }

  private static generateEmotionOptions(correctEmotion: string): string[] {
    const emotions = [
      'Joyful & Happy', 'Peaceful & Calm', 'Celebratory & Festive',
      'Nostalgic & Reflective', 'Loving & Tender', 'Proud & Accomplished',
      'Adventurous & Exciting', 'Cozy & Intimate'
    ];
    
    const formatted = this.formatEmotionalContext(correctEmotion);
    const options = [formatted];
    const otherEmotions = emotions.filter(emotion => emotion !== formatted);
    
    while (options.length < 4 && otherEmotions.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherEmotions.length);
      options.push(otherEmotions.splice(randomIndex, 1)[0]);
    }

    return this.shuffleArray(options);
  }

  private static generateCaptionOptions(keyWord: string): string[] {
    const options = [keyWord];
    const alternatives = [
      'celebration', 'gathering', 'vacation', 'birthday', 'anniversary',
      'graduation', 'wedding', 'holiday', 'picnic', 'reunion'
    ];
    
    const otherOptions = alternatives.filter(alt => 
      alt.toLowerCase() !== keyWord.toLowerCase()
    );
    
    while (options.length < 4 && otherOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherOptions.length);
      options.push(otherOptions.splice(randomIndex, 1)[0]);
    }

    return this.shuffleArray(options);
  }

  private static formatEmotionalContext(emotion: string): string {
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

    return emotionMap[emotion.toLowerCase()] || emotion;
  }

  private static extractKeyWordFromCaption(caption: string): string | null {
    const keywords = [
      'birthday', 'anniversary', 'wedding', 'graduation', 'vacation',
      'holiday', 'christmas', 'thanksgiving', 'celebration', 'party',
      'reunion', 'picnic', 'gathering', 'dinner', 'lunch'
    ];

    const lowerCaption = caption.toLowerCase();
    for (const keyword of keywords) {
      if (lowerCaption.includes(keyword)) {
        return keyword;
      }
    }

    return null;
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static async saveQuizResults(patientId: string, quizResults: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number;
    questions: QuizQuestion[];
    answers: { questionId: string; selectedAnswer: string; isCorrect: boolean; timeSpent: number }[];
  }): Promise<void> {
    try {
      const session = {
        patient_id: patientId,
        session_type: 'quiz',
        duration_seconds: quizResults.timeSpent,
        status: 'completed',
        started_at: new Date(Date.now() - quizResults.timeSpent * 1000).toISOString(),
        ended_at: new Date().toISOString(),
        quiz_data: {
          score: quizResults.score,
          total_questions: quizResults.totalQuestions,
          correct_answers: quizResults.correctAnswers,
          questions: quizResults.questions,
          answers: quizResults.answers
        }
      };

      await StorageService.saveSession(session);
    } catch (error) {
      console.error('Error saving quiz results:', error);
      throw error;
    }
  }

  static calculateScore(correctAnswers: number, totalQuestions: number, timeSpent: number): number {
    const accuracyScore = (correctAnswers / totalQuestions) * 70; // 70% weight for accuracy
    const speedBonus = Math.max(0, 30 - (timeSpent / totalQuestions)) * 1; // Speed bonus up to 30 points
    
    return Math.round(accuracyScore + speedBonus);
  }
}