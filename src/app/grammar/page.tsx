"use client";

import { useState, useEffect, useCallback } from "react";
import { grammarAPI, type Grammar } from "@/lib/api";

const BOOKS = [
  { id: "初級1", label: "大家的日本語 初級1", color: "bg-green-50 border-green-200 hover:bg-green-100", textColor: "text-green-700", badge: "bg-green-100 text-green-700" },
  { id: "初級2", label: "大家的日本語 初級2", color: "bg-teal-50 border-teal-200 hover:bg-teal-100", textColor: "text-teal-700", badge: "bg-teal-100 text-teal-700" },
];

type View = "books" | "lessons" | "grammars";

export default function GrammarPage() {
  const [view, setView] = useState<View>("books");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [lessons, setLessons] = useState<string[]>([]);
  const [grammars, setGrammars] = useState<Grammar[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // 載入課程列表
  useEffect(() => {
    if (!selectedBook) return;
    setLoading(true);
    setError(null);
    grammarAPI.getLessons(selectedBook)
      .then(setLessons)
      .catch(() => setError("無法載入課程"))
      .finally(() => setLoading(false));
  }, [selectedBook]);

  // 載入文法
  const fetchGrammars = useCallback(async () => {
    if (!selectedBook || !selectedLesson) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { book: selectedBook, lesson: selectedLesson };
      if (search) params.search = search;
      const data = await grammarAPI.getAll(params);
      setGrammars(data);
    } catch {
      setError("無法載入文法，請確認 API 是否運行中。");
    } finally {
      setLoading(false);
    }
  }, [selectedBook, selectedLesson, search]);

  useEffect(() => {
    if (view === "grammars") {
      const timer = setTimeout(fetchGrammars, 400);
      return () => clearTimeout(timer);
    }
  }, [view, fetchGrammars]);

  const selectBook = (book: string) => {
    setSelectedBook(book);
    setSelectedLesson(null);
    setGrammars([]);
    setView("lessons");
  };

  const selectLesson = (lesson: string) => {
    setSelectedLesson(lesson);
    setSearch("");
    setExpanded(null);
    setView("grammars");
  };

  const goBack = () => {
    if (view === "grammars") { setView("lessons"); setGrammars([]); }
    else if (view === "lessons") { setView("books"); setSelectedBook(null); }
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
          <h1 className="text-2xl font-bold text-gray-800">📝 文法說明</h1>
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
              <div className="text-4xl mb-3">📗</div>
              <h2 className={`text-xl font-bold ${book.textColor}`}>{book.label}</h2>
              <p className="text-gray-500 text-sm mt-2">點選查看各課文法</p>
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

      {/* 文法列表 */}
      {view === "grammars" && (
        <>
          <input
            type="text"
            placeholder="搜尋文法..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
          />
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>}
          {loading && <p className="text-gray-400 text-center py-8">載入中...</p>}
          {!loading && !error && (
            <div className="space-y-3">
              {grammars.length === 0 ? (
                <p className="text-gray-400 text-center py-8">沒有找到符合的文法</p>
              ) : (
                grammars.map((g) => (
                  <div key={g.id} className="border border-gray-200 rounded-xl bg-white overflow-hidden">
                    <button
                      className="w-full text-left px-5 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                      onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-gray-800">{g.title}</span>
                        <code className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {g.pattern}
                        </code>
                        {g.level && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {g.level}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400 ml-2">{expanded === g.id ? "▲" : "▼"}</span>
                    </button>
                    {expanded === g.id && (
                      <div className="px-5 pb-5 border-t border-gray-100">
                        <p className="text-gray-700 mt-4">{g.explanation}</p>
                        {g.examples && g.examples.length > 0 && (
                          <div className="mt-4">
                            <h3 className="text-sm font-semibold text-gray-500 mb-2">例句</h3>
                            <ul className="space-y-2">
                              {g.examples.map((ex, i) => (
                                <li key={i} className="bg-gray-50 rounded-lg p-3">
                                  <p className="font-medium text-gray-800">{ex.japanese}</p>
                                  <p className="text-sm text-gray-500 mt-1">{ex.english}</p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
