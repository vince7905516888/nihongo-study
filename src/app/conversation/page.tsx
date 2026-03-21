"use client";

import { useState, useEffect } from "react";
import { conversationAPI, type ConversationLine } from "@/lib/api";
import { speakJapanese } from "@/lib/speech";

const BOOKS = [
  { id: "初級1", label: "大家的日本語 初級1", color: "bg-orange-50 border-orange-200 hover:bg-orange-100", textColor: "text-orange-700" },
  { id: "初級2", label: "大家的日本語 初級2", color: "bg-cyan-50 border-cyan-200 hover:bg-cyan-100", textColor: "text-cyan-700" },
];

type View = "books" | "lessons" | "conversation";

export default function ConversationPage() {
  const [view, setView] = useState<View>("books");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [lessons, setLessons] = useState<string[]>([]);
  const [lines, setLines] = useState<ConversationLine[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBook) return;
    setLoading(true);
    conversationAPI.getLessons(selectedBook)
      .then(setLessons)
      .catch(() => setError("無法載入課程"))
      .finally(() => setLoading(false));
  }, [selectedBook]);

  const selectBook = (book: string) => {
    setSelectedBook(book);
    setSelectedLesson(null);
    setView("lessons");
  };

  const selectLesson = async (lesson: string) => {
    setSelectedLesson(lesson);
    setLoading(true);
    setError(null);
    setInputs({});
    setChecked({});
    try {
      const data = await conversationAPI.getLines(selectedBook!, lesson);
      setLines(data);
      setView("conversation");
    } catch {
      setError("無法載入會話");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (view === "conversation") { setView("lessons"); setLines([]); }
    else if (view === "lessons") { setView("books"); setSelectedBook(null); }
  };

  const handleCheck = (id: string, japanese: string) => {
    const userInput = (inputs[id] || "").trim();
    setChecked(prev => ({ ...prev, [id]: userInput === japanese }));
  };

  const handleReset = (id: string) => {
    setInputs(prev => ({ ...prev, [id]: "" }));
    setChecked(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const currentBook = BOOKS.find(b => b.id === selectedBook);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {view !== "books" && (
          <button onClick={goBack} className="text-gray-500 hover:text-gray-700 text-lg">←</button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💬 課程會話</h1>
          {view !== "books" && (
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedBook && <span className="font-medium">{currentBook?.label}</span>}
              {selectedLesson && <span> › {selectedLesson}</span>}
            </p>
          )}
        </div>
      </div>

      {/* 教材選擇 */}
      {view === "books" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {BOOKS.map(book => (
            <button key={book.id} onClick={() => selectBook(book.id)}
              className={`border-2 rounded-2xl p-8 text-left transition-all ${book.color}`}>
              <div className="text-4xl mb-3">💬</div>
              <h2 className={`text-xl font-bold ${book.textColor}`}>{book.label}</h2>
              <p className="text-gray-500 text-sm mt-2">點選查看各課會話</p>
            </button>
          ))}
        </div>
      )}

      {/* 課程選擇 */}
      {view === "lessons" && (
        <>
          {loading && <p className="text-gray-400 text-center py-8">載入中...</p>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>}
          {!loading && !error && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {lessons.length === 0 ? (
                <p className="text-gray-400 col-span-full text-center py-8">尚未新增課程資料</p>
              ) : (
                lessons.map(lesson => (
                  <button key={lesson} onClick={() => selectLesson(lesson)}
                    className={`border-2 rounded-xl p-4 text-center font-semibold transition-all ${currentBook?.color} ${currentBook?.textColor}`}>
                    {lesson}
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* 會話內容 */}
      {view === "conversation" && (
        <>
          {loading && <p className="text-gray-400 text-center py-8">載入中...</p>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>}
          {!loading && !error && (
            <div className="space-y-4">
              {lines.length === 0 ? (
                <p className="text-gray-400 text-center py-8">尚未新增會話資料</p>
              ) : (
                lines.map(line => {
                  const isChecked = line.id in checked;
                  const isCorrect = checked[line.id];
                  return (
                    <div key={line.id} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                      {/* 說話者 + 中文 */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold bg-orange-100 text-orange-700 px-3 py-1 rounded-full">{line.speaker}</span>
                        <span className="text-gray-600">{line.chinese}</span>
                      </div>

                      {/* 語音按鈕 */}
                      <div className="flex gap-2">
                        <button onClick={() => speakJapanese(line.reading || line.japanese)}
                          className="text-xl hover:scale-110 transition-transform" title="正常速度">🔊</button>
                        <button onClick={() => speakJapanese(line.reading || line.japanese, true)}
                          className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded transition-colors" title="慢速播放">🐢</button>
                      </div>

                      {/* 輸入比對 */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={inputs[line.id] || ""}
                          onChange={e => setInputs(prev => ({ ...prev, [line.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") handleCheck(line.id, line.japanese); }}
                          disabled={isChecked}
                          placeholder="輸入日文..."
                          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-gray-50 text-sm"
                        />
                        {!isChecked ? (
                          <button onClick={() => handleCheck(line.id, line.japanese)}
                            className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
                            比對
                          </button>
                        ) : (
                          <button onClick={() => handleReset(line.id)}
                            className="bg-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors">
                            重試
                          </button>
                        )}
                      </div>

                      {/* 比對結果 */}
                      {isChecked && (
                        <div className={`rounded-lg p-3 text-sm ${isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {isCorrect ? "✅ 正確！" : `❌ 正確答案：${line.japanese}`}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
