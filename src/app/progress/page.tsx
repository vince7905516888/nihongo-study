"use client";

import { useState, useEffect } from "react";
import { progressAPI, type Progress } from "@/lib/api";

export default function ProgressPage() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    progressAPI
      .get()
      .then(setProgress)
      .catch(() => setError("無法載入進度，請確認 API 是否運行中。"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-center py-16">載入中...</p>;
  if (error)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
    );

  const wordPct = progress
    ? Math.round((progress.learnedWords / (progress.totalWords || 1)) * 100)
    : 0;
  const grammarPct = progress
    ? Math.round((progress.learnedGrammar / (progress.totalGrammar || 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">📊 學習進度</h1>

      {progress && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-blue-100 rounded-2xl p-5">
              <h2 className="text-sm text-gray-500 mb-1">單字進度</h2>
              <div className="text-3xl font-bold text-blue-600">{wordPct}%</div>
              <p className="text-sm text-gray-500 mt-1">
                {progress.learnedWords} / {progress.totalWords} 個
              </p>
              <div className="mt-3 h-2 bg-blue-100 rounded-full">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all"
                  style={{ width: `${wordPct}%` }}
                />
              </div>
            </div>

            <div className="bg-white border border-green-100 rounded-2xl p-5">
              <h2 className="text-sm text-gray-500 mb-1">文法進度</h2>
              <div className="text-3xl font-bold text-green-600">{grammarPct}%</div>
              <p className="text-sm text-gray-500 mt-1">
                {progress.learnedGrammar} / {progress.totalGrammar} 個
              </p>
              <div className="mt-3 h-2 bg-green-100 rounded-full">
                <div
                  className="h-full bg-green-400 rounded-full transition-all"
                  style={{ width: `${grammarPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quiz History */}
          {progress.quizScores && progress.quizScores.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">測驗歷史記錄</h2>
              <div className="space-y-3">
                {[...progress.quizScores].reverse().map((record, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm text-gray-500">{record.date}</span>
                    <span
                      className={`font-semibold ${
                        record.score >= 80
                          ? "text-green-600"
                          : record.score >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {record.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
