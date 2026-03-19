"use client";

import { useState, useEffect, useCallback } from "react";
import { grammarAPI, type Grammar } from "@/lib/api";

const LEVELS = ["全部", "N5", "N4", "N3", "N2", "N1"];

export default function GrammarPage() {
  const [grammars, setGrammars] = useState<Grammar[]>([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("全部");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchGrammars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { level?: string; search?: string } = {};
      if (level !== "全部") params.level = level;
      if (search) params.search = search;
      const data = await grammarAPI.getAll(params);
      setGrammars(data);
    } catch (e) {
      setError("無法載入文法，請確認 API 是否運行中。");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [level, search]);

  useEffect(() => {
    const timer = setTimeout(fetchGrammars, 400);
    return () => clearTimeout(timer);
  }, [fetchGrammars]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">📝 文法說明</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="搜尋文法..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <div className="flex gap-2 flex-wrap">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                level === l
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
      )}
      {loading && <p className="text-gray-400 text-center py-8">載入中...</p>}

      {/* Grammar List */}
      {!loading && !error && (
        <div className="space-y-3">
          {grammars.length === 0 ? (
            <p className="text-gray-400 text-center py-8">沒有找到符合的文法</p>
          ) : (
            grammars.map((g) => (
              <div
                key={g.id}
                className="border border-gray-200 rounded-xl bg-white overflow-hidden"
              >
                <button
                  className="w-full text-left px-5 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                >
                  <div className="flex items-center gap-3">
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
                  <span className="text-gray-400">{expanded === g.id ? "▲" : "▼"}</span>
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
    </div>
  );
}
