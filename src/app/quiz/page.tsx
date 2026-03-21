"use client";

import { useState, useEffect, useRef } from "react";
import { quizAPI, vocabularyAPI, grammarAPI, conversationAPI, examplesAPI, type QuizQuestion } from "@/lib/api";
import { speakJapanese } from "@/lib/speech";

type QuizType = "vocabulary" | "grammar" | "conversation" | "examples";
type QuizState = "setup" | "playing" | "result";

interface WrongAnswer {
  question: QuizQuestion;
  userAnswer: string;
}

const TYPE_LABELS: Record<QuizType, string> = {
  vocabulary: "📖 單字聽力",
  grammar: "📝 文法",
  conversation: "💬 會話",
  examples: "📋 例句",
};

export default function QuizPage() {
  const [quizType, setQuizType] = useState<QuizType>("vocabulary");
  const [selectedBook, setSelectedBook] = useState("初級1");
  const [selectedLesson, setSelectedLesson] = useState("全部");
  const [lessons, setLessons] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [state, setState] = useState<QuizState>("setup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputReading, setInputReading] = useState("");
  const [inputWord, setInputWord] = useState("");
  const [inputSentence, setInputSentence] = useState("");
  const spokenRef = useRef(false);

  useEffect(() => {
    const apis: Record<QuizType, { getLessons: (book: string) => Promise<string[]> }> = {
      vocabulary: vocabularyAPI,
      grammar: grammarAPI,
      conversation: conversationAPI,
      examples: examplesAPI,
    };
    apis[quizType].getLessons(selectedBook).then(data => setLessons(data)).catch(() => setLessons([]));
    setSelectedLesson("全部");
  }, [quizType, selectedBook]);

  const q = questions[currentIndex];

  useEffect(() => {
    if (state === "playing" && q && q.type !== "grammar") {
      spokenRef.current = false;
      const timer = setTimeout(() => {
        if (!spokenRef.current) {
          spokenRef.current = true;
          speakJapanese(q.audio || q.answer);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, state, q]);

  const startQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const count = quizType === "grammar" ? 25 : 9999;
      const params: { type: string; count: number; book?: string; lesson?: string } = { type: quizType, count, book: selectedBook };
      if (selectedLesson !== "全部") params.lesson = selectedLesson;
      const data = await quizAPI.getQuestions(params);
      setQuestions(data);
      setCurrentIndex(0);
      setScore(0);
      setWrongAnswers([]);
      setSelected(null);
      setFeedback(null);
      setInputReading("");
      setInputWord("");
      setInputSentence("");
      setState("playing");
    } catch {
      setError("無法載入題目，請確認 API 是否運行中。");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (userAnswer: string) => {
    if (selected) return;
    setSelected(userAnswer);
    const correct = userAnswer === q.answer;
    setFeedback({ correct });
    if (correct) {
      setScore(s => s + 1);
    } else {
      setWrongAnswers(prev => [...prev, { question: q, userAnswer }]);
    }
  };

  const handleVocabSubmit = () => {
    if (selected) return;
    const reading = inputReading.trim();
    const word = inputWord.trim();
    if (!reading) return;
    if (q.word && !word) return;
    const readingCorrect = reading === q.answer;
    const wordCorrect = q.word ? word === String(q.word) : true;
    const correct = readingCorrect && wordCorrect;
    const userAnswer = q.word ? `${reading}（${word}）` : reading;
    setSelected(userAnswer);
    setFeedback({ correct });
    if (correct) {
      setScore(s => s + 1);
    } else {
      setWrongAnswers(prev => [...prev, { question: q, userAnswer }]);
    }
  };

  const handleSentenceSubmit = () => {
    if (selected) return;
    const sentence = inputSentence.trim();
    if (!sentence) return;
    const correct = sentence === q.answer;
    setSelected(sentence);
    setFeedback({ correct });
    if (correct) {
      setScore(s => s + 1);
    } else {
      setWrongAnswers(prev => [...prev, { question: q, userAnswer: sentence }]);
    }
  };

  const next = () => {
    if (currentIndex + 1 >= questions.length) {
      setState("result");
    } else {
      setCurrentIndex(i => i + 1);
      setSelected(null);
      setFeedback(null);
      setInputReading("");
      setInputWord("");
      setInputSentence("");
    }
  };

  // ---- Setup ----
  if (state === "setup") {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">✏️ 測驗練習</h1>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">測驗類型</label>
            <div className="grid grid-cols-2 gap-2">
              {(["vocabulary", "grammar", "conversation", "examples"] as QuizType[]).map(t => (
                <button key={t} onClick={() => setQuizType(t)}
                  className={`py-2 rounded-lg font-medium transition-colors ${quizType === t ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">教材</label>
            <div className="flex gap-2">
              {["初級1", "初級2"].map(b => (
                <button key={b} onClick={() => setSelectedBook(b)}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${selectedBook === b ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  大家的日本語 {b}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">課程</label>
            <div className="flex gap-2 flex-wrap">
              {["全部", ...lessons].map(l => (
                <button key={l} onClick={() => setSelectedLesson(l)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedLesson === l ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {quizType === "vocabulary" && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
              👂 單字測驗：系統自動播放日文語音，請輸入正確讀音與單字
            </div>
          )}
          {(quizType === "conversation" || quizType === "examples") && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
              👂 聽語音後，輸入對應的日文句子
            </div>
          )}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
          <button onClick={startQuiz} disabled={loading}
            className="w-full bg-purple-500 text-white py-3 rounded-xl font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50">
            {loading ? "載入中..." : "開始測驗"}
          </button>
        </div>
      </div>
    );
  }

  // ---- Result ----
  if (state === "result") {
    const pct = Math.round((score / questions.length) * 100);
    const isGrammar = questions[0]?.type === "grammar";
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold">測驗結果</h1>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          {isGrammar ? (
            <>
              <div className="text-5xl font-bold text-purple-600">{pct} <span className="text-2xl">/ 100</span></div>
              <p className="text-gray-600 mt-2">{questions.length} 題中答對 {score} 題</p>
            </>
          ) : (
            <>
              <div className="text-5xl font-bold text-purple-600">{score} <span className="text-2xl">/ {questions.length}</span></div>
              <p className="text-gray-600 mt-2">正確率 {pct}%</p>
            </>
          )}
          <div className="mt-3 text-2xl">
            {pct >= 80 ? "🎉 優秀！" : pct >= 60 ? "👍 繼續加油！" : "📚 多加練習！"}
          </div>
        </div>
        {wrongAnswers.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-red-600">❌ 答錯的題目（{wrongAnswers.length} 題）</h2>
            {wrongAnswers.map((w, i) => (
              <div key={i} className="bg-white border border-red-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => speakJapanese(w.question.audio || w.question.answer)}
                    className="text-lg hover:scale-110 transition-transform" title="播放語音">🔊</button>
                  <span className="font-bold text-gray-800">{w.question.question}</span>
                  {w.question.word && <span className="text-gray-400 text-sm">（{w.question.word}）</span>}
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="text-red-500">✗ 你的答案：</span>{w.userAnswer}</p>
                  <p><span className="text-green-600">✓ 正確答案：</span>{w.question.answer}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setState("setup")}
          className="w-full bg-purple-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-600 transition-colors">
          再測一次
        </button>
      </div>
    );
  }

  // ---- Playing ----
  const isVocab = q?.type === "vocabulary";
  const isSentence = q?.type === "conversation" || q?.type === "examples";
  const isGrammar = q?.type === "grammar";
  const hasWord = isVocab && !!q?.word;
  const canSubmitVocab = inputReading.trim() !== "" && (!hasWord || inputWord.trim() !== "");
  const canSubmitSentence = inputSentence.trim() !== "";

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">✏️ 測驗中</h1>
        <span className="text-sm text-gray-500">{currentIndex + 1} / {questions.length}</span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-purple-400 transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>

      {q && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          {/* 題目 */}
          <div className="text-center space-y-3">
            {isVocab && (
              <>
                <p className="text-sm text-gray-500">👂 聽語音，輸入正確的日文讀音</p>
                <p className="text-3xl font-bold text-gray-800">{q.question}</p>
                {q.word && <p className="text-pink-500 text-lg">{q.word}</p>}
                <button onClick={() => speakJapanese(q.audio || q.answer)}
                  className="text-3xl hover:scale-110 transition-transform" title="重播語音">🔊</button>
              </>
            )}
            {isSentence && (
              <>
                <p className="text-sm text-gray-500">👂 聽語音，輸入對應的日文句子</p>
                <p className="text-xl font-bold text-gray-800">{q.question}</p>
                <div className="flex justify-center gap-2">
                  <button onClick={() => speakJapanese(q.audio || q.answer)}
                    className="text-3xl hover:scale-110 transition-transform" title="正常速度">🔊</button>
                  <button onClick={() => speakJapanese(q.audio || q.answer, true)}
                    className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-600 px-2 py-1 rounded transition-colors" title="慢速播放">🐢</button>
                </div>
              </>
            )}
            {isGrammar && (
              <p className="text-lg font-medium text-gray-800">{q.question}</p>
            )}
          </div>

          {/* 輸入框 / 選項 */}
          {isVocab && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">讀音（平假名／片假名）</label>
                <input
                  type="text"
                  value={inputReading}
                  onChange={e => setInputReading(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !selected && canSubmitVocab) handleVocabSubmit(); }}
                  disabled={!!selected}
                  placeholder="輸入讀音..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50"
                />
              </div>
              {hasWord && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">日文單字</label>
                  <input
                    type="text"
                    value={inputWord}
                    onChange={e => setInputWord(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !selected && canSubmitVocab) handleVocabSubmit(); }}
                    disabled={!!selected}
                    placeholder="輸入日文單字..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50"
                  />
                </div>
              )}
              {!selected && (
                <button onClick={handleVocabSubmit} disabled={!canSubmitVocab}
                  className="w-full bg-purple-500 text-white py-2.5 rounded-xl font-medium hover:bg-purple-600 transition-colors disabled:opacity-40">
                  確認答案
                </button>
              )}
            </div>
          )}

          {isSentence && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">輸入日文句子</label>
                <input
                  type="text"
                  value={inputSentence}
                  onChange={e => setInputSentence(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !selected && canSubmitSentence) handleSentenceSubmit(); }}
                  disabled={!!selected}
                  placeholder="輸入日文..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50"
                />
              </div>
              {!selected && (
                <button onClick={handleSentenceSubmit} disabled={!canSubmitSentence}
                  className="w-full bg-purple-500 text-white py-2.5 rounded-xl font-medium hover:bg-purple-600 transition-colors disabled:opacity-40">
                  確認答案
                </button>
              )}
            </div>
          )}

          {isGrammar && (
            <div className="space-y-3">
              {q.options.filter(opt => opt !== "?").map(opt => {
                let cls = "border border-gray-200 text-gray-700 hover:bg-gray-50";
                if (selected) {
                  if (opt === q.answer) cls = "border-green-400 bg-green-50 text-green-700";
                  else if (opt === selected) cls = "border-red-400 bg-red-50 text-red-700";
                }
                return (
                  <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!selected}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${cls}`}>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* 回饋 */}
          {selected && feedback && (
            <div className={`rounded-lg p-3 text-sm ${feedback.correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {feedback.correct ? "✅ 正確！" : (
                <div>
                  <p>❌ 正確答案是：</p>
                  <p className="mt-1 font-medium">{q.answer}</p>
                  {isSentence && (
                    <button onClick={() => speakJapanese(q.audio || q.answer)}
                      className="mt-1 text-base hover:scale-110 transition-transform inline-block" title="播放正確答案">🔊</button>
                  )}
                </div>
              )}
            </div>
          )}

          {selected && (
            <button onClick={next}
              className="w-full bg-purple-500 text-white py-2.5 rounded-xl font-medium hover:bg-purple-600 transition-colors">
              {currentIndex + 1 >= questions.length ? "查看結果" : "下一題"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
