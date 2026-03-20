"use client";

import { useState, useEffect, useRef } from "react";
import { quizAPI, type QuizQuestion } from "@/lib/api";
import { speakJapanese } from "@/lib/speech";

type QuizType = "vocabulary" | "grammar";
type QuizState = "setup" | "playing" | "result";

interface WrongAnswer {
  question: QuizQuestion;
  userAnswer: string;
}

export default function QuizPage() {
  const [quizType, setQuizType] = useState<QuizType>("vocabulary");
  const [level, setLevel] = useState("N5");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation?: string } | null>(null);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [state, setState] = useState<QuizState>("setup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const spokenRef = useRef(false);

  const q = questions[currentIndex];

  // 每題出現時自動播音
  useEffect(() => {
    if (state === "playing" && q && q.type === "vocabulary") {
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
      const data = await quizAPI.getQuestions({ type: quizType, level, count: 25 });
      setQuestions(data);
      setCurrentIndex(0);
      setScore(0);
      setWrongAnswers([]);
      setSelected(null);
      setFeedback(null);
      setState("playing");
    } catch {
      setError("無法載入題目，請確認 API 是否運行中。");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (option: string) => {
    if (selected) return;
    setSelected(option);
    try {
      const result = await quizAPI.submitAnswer(q.id, option);
      setFeedback(result);
      if (result.correct) {
        setScore(s => s + 1);
      } else {
        setWrongAnswers(prev => [...prev, { question: q, userAnswer: option }]);
      }
    } catch {
      const correct = option === q.answer;
      setFeedback({ correct });
      if (correct) {
        setScore(s => s + 1);
      } else {
        setWrongAnswers(prev => [...prev, { question: q, userAnswer: option }]);
      }
    }
  };

  const next = () => {
    if (currentIndex + 1 >= questions.length) {
      setState("result");
    } else {
      setCurrentIndex(i => i + 1);
      setSelected(null);
      setFeedback(null);
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
            <div className="flex gap-3">
              {(["vocabulary", "grammar"] as QuizType[]).map(t => (
                <button key={t} onClick={() => setQuizType(t)}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${quizType === t ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {t === "vocabulary" ? "📖 單字聽力" : "📝 文法"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">難度等級</label>
            <div className="flex gap-2 flex-wrap">
              {["N5", "N4", "N3", "N2", "N1"].map(l => (
                <button key={l} onClick={() => setLevel(l)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${level === l ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {quizType === "vocabulary" && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
              👂 單字測驗為聽力模式：系統自動播放日文語音，請選出正確的中文意思
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
    const totalScore = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold">測驗結果</h1>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <div className="text-5xl font-bold text-purple-600">{totalScore} <span className="text-2xl">/ 100</span></div>
          <p className="text-gray-600 mt-2">{questions.length} 題中答對 {score} 題</p>
          <div className="mt-3 text-2xl">
            {totalScore >= 80 ? "🎉 優秀！" : totalScore >= 60 ? "👍 繼續加油！" : "📚 多加練習！"}
          </div>
        </div>

        {/* 錯題回顧 */}
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
            {q.type === "vocabulary" ? (
              <>
                <p className="text-sm text-gray-500">👂 聽語音，選出正確的日文讀音</p>
                <p className="text-3xl font-bold text-gray-800">{q.question}</p>
                {q.word && <p className="text-pink-500 text-lg">{q.word}</p>}
                <button onClick={() => speakJapanese(q.audio || q.answer)}
                  className="text-3xl hover:scale-110 transition-transform" title="重播語音">🔊</button>
              </>
            ) : (
              <p className="text-lg font-medium text-gray-800">{q.question}</p>
            )}
          </div>

          {/* 選項 */}
          <div className="space-y-3">
            {q.options.map(opt => {
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

          {/* 回饋 */}
          {selected && feedback && (
            <div className={`rounded-lg p-3 text-sm ${feedback.correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {feedback.correct ? "✅ 正確！" : `❌ 正確答案是：${q.answer}`}
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
