import Link from "next/link";

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
  {
    href: "/progress",
    icon: "📊",
    title: "學習進度",
    desc: "追蹤已學單字、文法與測驗成績",
    color: "bg-pink-50 border-pink-200 hover:bg-pink-100",
    textColor: "text-pink-700",
  },
];

export default function Home() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-gray-800">
          日本語学習へようこそ 🌸
        </h1>
        <p className="text-lg text-gray-500">歡迎來到日文學習平台，開始你的學習之旅！</p>
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
