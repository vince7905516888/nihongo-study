const API_BASE_URL = "/api/gas";

// --- Types ---
export interface Vocabulary {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  level?: string;
  book?: string;
  lesson?: string;
  examples?: string[];
}

export interface Grammar {
  id: string;
  title: string;
  pattern: string;
  explanation: string;
  examples?: { japanese: string; english: string }[];
  level?: string;
  book?: string;
  lesson?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  word?: string;
  audio?: string;
  options: string[];
  answer: string;
  type: "vocabulary" | "grammar";
}

export interface Progress {
  learnedWords: number;
  totalWords: number;
  learnedGrammar: number;
  totalGrammar: number;
  quizScores: { date: string; score: number }[];
}

// --- Helpers ---
// Google Apps Script web apps use query params for GET, body for POST
async function gasGet<T>(action: string, params?: Record<string, string>): Promise<T> {
  const query = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${API_BASE_URL}?${query}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function gasPost<T>(action: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// --- Vocabulary API ---
export const vocabularyAPI = {
  getAll: (params?: { level?: string; search?: string; book?: string; lesson?: string }) =>
    gasGet<Vocabulary[]>("getVocabulary", params as Record<string, string>),
  getLessons: async (book: string) => {
    const res = await gasGet<unknown>("getLessons", { book });
    return Array.isArray(res) ? res as string[] : [];
  },
  getById: (id: string) =>
    gasGet<Vocabulary>("getVocabularyById", { id }),
};

// --- Grammar API ---
export const grammarAPI = {
  getAll: (params?: { level?: string; search?: string; book?: string; lesson?: string }) =>
    gasGet<Grammar[]>("getGrammar", params as Record<string, string>),
  getLessons: async (book: string) => {
    const res = await gasGet<unknown>("getGrammarLessons", { book });
    return Array.isArray(res) ? res as string[] : [];
  },
  getById: (id: string) =>
    gasGet<Grammar>("getGrammarById", { id }),
};

// --- Quiz API ---
export const quizAPI = {
  getQuestions: (params?: { type?: string; level?: string; count?: number; book?: string; lesson?: string }) =>
    gasGet<QuizQuestion[]>("getQuizQuestions", params as Record<string, string>),
  submitAnswer: (questionId: string, answer: string) =>
    gasPost<{ correct: boolean; explanation?: string }>("submitAnswer", { questionId, answer }),
};

// --- Progress API ---
export const progressAPI = {
  get: () => gasGet<Progress>("getProgress"),
  markLearned: (type: "vocabulary" | "grammar", id: string) =>
    gasPost<void>("markLearned", { type, id }),
  saveQuizScore: (score: number, total: number) =>
    gasPost<void>("saveQuizScore", { score, total }),
};
