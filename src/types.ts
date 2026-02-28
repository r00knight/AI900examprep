export interface Question {
  id: string;
  question_text: string;
  options: { [key: string]: string };
  correct_answer: string;
  module_topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}

export interface User {
  id: string;
  email?: string;
  username: string;
  isAdmin: boolean;
  history: TestResult[];
  savedState: SavedState | null;
  isGuest?: boolean;
}

export interface TestResult {
  id: string;
  date: string;
  score: number;
  totalQuestions: number;
  answers: {
    questionId: string;
    isCorrect: boolean;
    selectedAnswer: string;
  }[];
}

export interface SavedState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: { [questionId: string]: string }; // questionId -> selectedOption
  score: number;
  config: TestConfig;
}

export interface TestConfig {
  questionCount: number;
  modules: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  struggleFocus: boolean;
}
