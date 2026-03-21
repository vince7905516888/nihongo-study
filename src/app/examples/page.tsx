"use client";

import { useState, useEffect } from "react";
import { examplesAPI, type ExampleLine } from "@/lib/api";
import { speakJapanese } from "@/lib/speech";

const BOOKS = [
  { id: "初級1", label: "大家的日本語 初級1", color: "bg-blue-50 border-blue-200 hover:bg-blue-100", textColor: "text-blue-700" },
  { id: "初級2", label: "大家的日本語 初級2", color: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100", textColor: "text-indigo-700" },
];

type View = "books" | "lessons" | "examples";

export default function ExamplesPage() {
  const [view, setView] = useState<View>("books");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [lessons, setLessons] = useState<string[]>([]);
  const [lines, setLines] = useState<ExampleLine[]>([]);
  const [showChinese, setShowChinese] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBook) return;
    setLoading(true);
    examplesAPI.getLessons(selectedBook)
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
    setShowChinese({});
    try {
      const data = await examplesAPI.getLines(selectedBook!, lesson);
      setLines(data);
      setView("examples");
    } catch {
      setError("無法載入例句");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (view === "examples") { setView("lessons"); setLines([]); }
    else if (view === "lessons") { setView("books"); setSelectedBook(null); }
  };

  const toggleChinese = (id: string) => {
    setShowChinese(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const showAllChinese = () => {
    const all: Record<string, boolean> = {};
    lines.forEach(l => { all[l.id] = true; });
    setShowChinese(all);
  };

  const hideAllChinese = () => setShowChinese({});

  const currentBook = BOOKS.find(b => b.id === selectedBook);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {view !== "books" && (
          <button onClick={goBack} className="text-gray-500 hover:text-gray-700 text-lg">←</button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">📋 例句練習</h1>
          {view !== "books" && (
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedBook && <span className="font-medium">{currentBook?.label}</span>}
              {selectedLesson && <span> › {selectedLesson}</span>}
            </p>
          )}
        </div>
        {view === "examples" && (
          <div className="flex gap-2">
            <button onClick={showAllChinese}
              className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors">
              顯示全部中文
            </button>
            <button onClick={hideAllChinese}
              className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
              隱藏全部
            </button>
          </div>
        )}
      </div>

      {/* 教材選擇 */}
      {view === "books" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {BOOKS.map(book => (
            <button key={book.id} onClick={() => selectBook(book.id)}
              className={`border-2 rounded-2xl p-8 text-left transition-all ${book.color}`}>
              <div className="text-4xl mb-3">📋</div>
              <h2 className={`text-xl font-bold ${book.textColor}`}>{book.label}</h2>
              <p className="text-gray-500 text-sm mt-2">點選查看各課例句</p>
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

      {/* 例句內容 */}
      {view === "examples" && (
        <>
          {loading && <p className="text-gray-400 text-center py-8">載入中...</p>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>}
          {!loading && !error && (
            <div className="space-y-3">
              {lines.length === 0 ? (
                <p className="text-gray-400 text-center py-8">尚未新增例句資料</p>
              ) : (
                lines.map((line, idx) => (
                  <div key={line.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">{idx + 1}</span>
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium">{line.japanese}</p>
                        {showChinese[line.id] && (
                          <p className="text-gray-500 text-sm mt-1">{line.chinese}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => speakJapanese(line.reading || line.japanese)}
                          className="text-xl hover:scale-110 transition-transform" title="正常速度">🔊</button>
                        <button onClick={() => speakJapanese(line.reading || line.japanese, true)}
                          className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded transition-colors" title="慢速播放">🐢</button>
                        <button onClick={() => toggleChinese(line.id)}
                          className={`text-xs px-2 py-1 rounded-lg transition-colors ${showChinese[line.id] ? "bg-blue-200 text-blue-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                          中文
                        </button>
                      </div>
                    </div>
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
