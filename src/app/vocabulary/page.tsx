"use client";

import { useState, useEffect, useCallback } from "react";
import { vocabularyAPI, type Vocabulary } from "@/lib/api";
import { speakJapanese } from "@/lib/speech";

const BOOKS = [
  { id: "初級1", label: "大家的日本語 初級1", color: "bg-pink-50 border-pink-200 hover:bg-pink-100", textColor: "text-pink-700", badge: "bg-pink-100 text-pink-700" },
  { id: "初級2", label: "大家的日本語 初級2", color: "bg-purple-50 border-purple-200 hover:bg-purple-100", textColor: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
];

type View = "books" | "lessons" | "words";

export default function VocabularyPage() {
  const [view, setView] = useState<View>("books");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [lessons, setLessons] = useState<string[]>([]);
  const [words, setWords] = useState<Vocabulary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Vocabulary | null>(null);

  // 載入課程列表
  useEffect(() => {
    if (!selectedBook) return;
    setLoading(true);
    setError(null);
    vocabularyAPI.getLessons(selectedBook)
      .then(setLessons)
      .catch(() => setError("無法載入課程"))
      .finally(() => setLoading(false));
  }, [selectedBook]);

  // 載入單字
  const fetchWords = useCallback(async () => {
    if (!selectedBook || !selectedLesson) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { book: selectedBook, lesson: selectedLesson };
      if (search) params.search = search;
      const data = await vocabularyAPI.getAll(params);
      setWords(data);
    } catch {
      setError("無法載入單字，請確認 API 是否運行中。");
    } finally {
      setLoading(false);
    }
  }, [selectedBook, selectedLesson, search]);

  useEffect(() => {
    if (view === "words") {
      const timer = setTimeout(fetchWords, 400);
      return () => clearTimeout(timer);
    }
  }, [view, fetchWords]);

  const selectBook = (book: string) => {
    setSelectedBook(book);
    setSelectedLesson(null);
    setWords([]);
    setView("lessons");
  };

  const selectLesson = (lesson: string) => {
    setSelectedLesson(lesson);
    setSearch("");
    setView("words");
  };

  const goBack = () => {
    if (view === "words") { setView("lessons"); setWords([]); }
    else if (view === "lessons") { setView("books"); setSelectedBook(null); }
  };

  const currentBook = BOOKS.find(b => b.id === selectedBook);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {view !== "books" && (
          <button onClick={goBack} className="text-gray-500 hover:text-gray-700 text-lg">← </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📖 單字學習</h1>
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
            <button
              key={book.id}
              onClick={() => selectBook(book.id)}
              className={`border-2 rounded-2xl p-8 text-left transition-all ${book.color}`}
            >
              <div className="text-4xl mb-3">📚</div>
              <h2 className={`text-xl font-bold ${book.textColor}`}>{book.label}</h2>
              <p className="text-gray-500 text-sm mt-2">點選查看各課單字</p>
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
                  <button
                    key={lesson}
                    onClick={() => selectLesson(lesson)}
                    className={`border-2 rounded-xl p-4 text-center font-semibold transition-all ${currentBook?.color} ${currentBook?.textColor}`}
                  >
                    {lesson}
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* 單字列表 */}
      {view === "words" && (
        <>
          <input
            type="text"
            placeholder="搜尋單字..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>}
          {loading && <p className="text-gray-400 text-center py-8">載入中...</p>}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {words.length === 0 ? (
                <p className="text-gray-400 col-span-full text-center py-8">沒有找到單字</p>
              ) : (
                words.map(w => (
                  <div key={w.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:border-pink-300 hover:shadow-sm transition-all">
                    <div className="flex justify-between items-start">
                      <button onClick={() => setSelected(w)} className="text-left flex-1">
                        <div className="text-xl font-bold text-gray-800">{w.word}</div>
                        <div className="text-sm text-pink-600 mt-1">{w.reading}</div>
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">{w.meaning}</div>
                      </button>
                      <button onClick={() => speakJapanese(w.reading)} className="ml-2 text-xl hover:scale-110 transition-transform" title="發音">🔊</button>
                    </div>
                    {w.level && <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{w.level}</span>}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* 詳細 Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold">{selected.word}</h2>
                  <button onClick={() => speakJapanese(selected.reading)} className="text-2xl hover:scale-110 transition-transform" title="正常速度">🔊</button>
                  <button onClick={() => speakJapanese(selected.reading, true)} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded transition-colors" title="慢速播放">🐢</button>
                </div>
                <p className="text-pink-600 mt-1">{selected.reading}</p>
              </div>
              {selected.level && <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{selected.level}</span>}
            </div>
            <p className="text-gray-700 mb-4">{selected.meaning}</p>
            {selected.examples && selected.examples.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">例句</h3>
                <ul className="space-y-2">
                  {selected.examples.map((ex, i) => (
                    <li key={i} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{ex}</li>
                  ))}
                </ul>
              </div>
            )}
            <button onClick={() => setSelected(null)} className="mt-5 w-full bg-pink-500 text-white rounded-lg py-2 hover:bg-pink-600 transition-colors">關閉</button>
          </div>
        </div>
      )}
    </div>
  );
}
