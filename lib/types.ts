export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
  language: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  primarySoftware: string[];
  focusAreas: string[];
  skillGoal: string;
  fontSize: 'sm' | 'md' | 'lg';
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  createdAt: string;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface ChatGroup {
  label: string;
  chats: Chat[];
}

export type Language =
  | 'en'
  | 'uz'
  | 'ru'
  | 'tr'
  | 'ja'
  | 'ko'
  | 'ar'
  | 'fr'
  | 'es'
  | 'de'
  | 'zh'
  | 'pt'
  | 'hi';

export interface WelcomeMessage {
  lang: Language;
  label: string;
  message: (nickname: string) => string;
}

export interface SuggestionCard {
  icon: string;
  title: string;
  description: string;
  prompt: string;
}

export interface ApiError {
  error: string;
  code?: string;
}
