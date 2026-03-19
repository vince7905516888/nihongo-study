"use client";

import { useState, useEffect, useCallback } from "react";
import { vocabularyAPI, type Vocabulary } from "@/lib/api";

const LEVELS = ["全部", "N5", "N4", "N3", "N2", "N1"];

export default function VocabularyPage() {
  const [words, setWords] = useState<Vocabulary[]>([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("全部");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Vocabulary | null>(null);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { level?: string; search?: string } = {};
      if (level !== "全部") params.level = level;
      if (search) params.search = search;
      const data = await vocabularyAPI.getAll(params);
      setWords(data);
    } catch (e) {
      setError("無法載入單字，請確認 API 是否運行中。");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [level, search]);

  useEffect(() => {
    const timer = setTimeout(fetchWords, 400);
    return () => clearTimeout(timer);
  }, [fetchWords]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">📖 單字學習</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="搜尋單字..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <div className="flex gap-2 flex-wrap">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                level === l
                  ? "bg-pink-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Error / Loading */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}
      {loading && <p className="text-gray-400 text-center py-8">載入中...</p>}

      {/* Word List */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {words.length === 0 ? (
            <p className="text-gray-400 col-span-full text-center py-8">沒有找到符合的單字</p>
          ) : (
            words.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelected(w)}
                className="text-left border border-gray-200 rounded-xl p-4 hover:border-pink-300 hover:shadow-sm transition-all bg-white"
              >
                <div className="text-xl font-bold text-gray-800">{w.word}</div>
                <div className="text-sm text-pink-600 mt-1">{w.reading}</div>
                <div className="text-sm text-gray-600 mt-1 line-clamp-2">{w.meaning}</div>
                {w.level && (
                  <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {w.level}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-3xl font-bold">{selected.word}</h2>
                <p className="text-pink-600 mt-1">{selected.reading}</p>
              </div>
              {selected.level && (
                <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  {selected.level}
                </span>
              )}
            </div>
            <p className="text-gray-700 mb-4">{selected.meaning}</p>
            {selected.examples && selected.examples.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">例句</h3>
                <ul className="space-y-2">
                  {selected.examples.map((ex, i) => (
                    <li key={i} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full bg-pink-500 text-white rounded-lg py-2 hover:bg-pink-600 transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
