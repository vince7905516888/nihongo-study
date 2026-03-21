"use client";

import Link from "next/link";
import { useState } from "react";
import { vocabularyAPI, type Vocabulary } from "@/lib/api";
import { speakJapanese } from "@/lib/speech";

const features = [
  {
    href: "/vocabulary",
    icon: "📖",
    title: "單字學習",
    desc: "查詢日文單字、假名讀法與例句",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    textColor: "text-blue-700",
  },
  {
    href: "/grammar",
    icon: "📝",
    title: "文法說明",
    desc: "瀏覽日文文法規則與用法解說",
    color: "bg-green-50 border-green-200 hover:bg-green-100",
    textColor: "text-green-700",
  },
  {
    href: "/quiz",
    icon: "✏️",
    title: "測驗練習",
    desc: "單字與文法測驗，鞏固學習成果",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    textColor: "text-purple-700",
  },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await vocabularyAPI.getAll({ search: search.trim() });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-gray-800">
          日本語学習へようこそ 🌸
        </h1>
        <p className="text-lg text-gray-500">歡迎來到日文學習平台，開始你的學習之旅！</p>
      </div>

      {/* 單字查詢 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">🔍 單字快速查詢</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
            placeholder="輸入中文、日文或讀音..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? "查詢中..." : "查詢"}
          </button>
        </div>

        {searched && (
          <div className="space-y-2">
            {results.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">找不到符合的單字</p>
            ) : (
              results.map(w => (
                <div key={w.id} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="font-bold text-gray-800">{w.word}</span>
                      <span className="text-pink-500 text-sm ml-2">{w.reading}</span>
                    </div>
                    <span className="text-gray-600 text-sm">{w.meaning}</span>
                    {w.lesson && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{w.book} {w.lesson}</span>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => speakJapanese(w.reading)} className="text-xl hover:scale-110 transition-transform" title="正常速度">🔊</button>
                    <button onClick={() => speakJapanese(w.reading, true)} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded transition-colors" title="慢速播放">🐢</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`border rounded-2xl p-6 transition-all ${f.color}`}
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h2 className={`text-xl font-semibold mb-1 ${f.textColor}`}>{f.title}</h2>
            <p className="text-gray-600 text-sm">{f.desc}</p>
          </Link>
        ))}
      </div>

      {/* Quick stats placeholder */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">今日學習摘要</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">-</div>
            <div className="text-sm text-gray-500">已學單字</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">-</div>
            <div className="text-sm text-gray-500">已學文法</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-pink-600">-</div>
            <div className="text-sm text-gray-500">測驗完成</div>
          </div>
        </div>
      </div>
    </div>
  );
}
