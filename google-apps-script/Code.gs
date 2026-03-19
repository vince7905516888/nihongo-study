/**
 * nihongo-study - Google Apps Script 後端
 *
 * Google Sheets 試算表結構：
 *   工作表1「Vocabulary」: id | word | reading | meaning | level | examples(逗號分隔)
 *   工作表2「Grammar」:    id | title | pattern | explanation | level | examples(JSON)
 *   工作表3「Progress」:   type(word/grammar) | id | learnedAt
 *   工作表4「QuizScores」: score | total | date
 */

// =====================
// 主入口
// =====================

function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;

    switch (action) {
      case "getVocabulary":
        result = getVocabulary(e.parameter);
        break;
      case "getVocabularyById":
        result = getVocabularyById(e.parameter.id);
        break;
      case "getGrammar":
        result = getGrammar(e.parameter);
        break;
      case "getGrammarById":
        result = getGrammarById(e.parameter.id);
        break;
      case "getQuizQuestions":
        result = getQuizQuestions(e.parameter);
        break;
      case "getProgress":
        result = getProgress();
        break;
      default:
        result = { error: "Unknown action: " + action };
    }

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    let result;

    switch (action) {
      case "submitAnswer":
        result = submitAnswer(body.questionId, body.answer);
        break;
      case "markLearned":
        result = markLearned(body.type, body.id);
        break;
      case "saveQuizScore":
        result = saveQuizScore(body.score, body.total);
        break;
      default:
        result = { error: "Unknown action: " + action };
    }

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

// =====================
// 工具函式
// =====================

function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error("找不到工作表：" + name);
  return sheet;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

// =====================
// 單字
// =====================

function getVocabulary(params) {
  const sheet = getSheet("Vocabulary");
  let rows = sheetToObjects(sheet);

  // 過濾等級
  if (params.level) {
    rows = rows.filter(r => r.level === params.level);
  }

  // 搜尋
  if (params.search) {
    const q = params.search.toLowerCase();
    rows = rows.filter(r =>
      String(r.word).toLowerCase().includes(q) ||
      String(r.reading).toLowerCase().includes(q) ||
      String(r.meaning).toLowerCase().includes(q)
    );
  }

  return rows.map(formatVocabulary);
}

function getVocabularyById(id) {
  const sheet = getSheet("Vocabulary");
  const rows = sheetToObjects(sheet);
  const row = rows.find(r => String(r.id) === String(id));
  if (!row) throw new Error("找不到單字 id: " + id);
  return formatVocabulary(row);
}

function formatVocabulary(row) {
  return {
    id: String(row.id),
    word: row.word,
    reading: row.reading,
    meaning: row.meaning,
    level: row.level || "",
    examples: row.examples
      ? String(row.examples).split(",").map(s => s.trim()).filter(Boolean)
      : []
  };
}

// =====================
// 文法
// =====================

function getGrammar(params) {
  const sheet = getSheet("Grammar");
  let rows = sheetToObjects(sheet);

  if (params.level) {
    rows = rows.filter(r => r.level === params.level);
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    rows = rows.filter(r =>
      String(r.title).toLowerCase().includes(q) ||
      String(r.pattern).toLowerCase().includes(q) ||
      String(r.explanation).toLowerCase().includes(q)
    );
  }

  return rows.map(formatGrammar);
}

function getGrammarById(id) {
  const sheet = getSheet("Grammar");
  const rows = sheetToObjects(sheet);
  const row = rows.find(r => String(r.id) === String(id));
  if (!row) throw new Error("找不到文法 id: " + id);
  return formatGrammar(row);
}

function formatGrammar(row) {
  let examples = [];
  try {
    if (row.examples) examples = JSON.parse(row.examples);
  } catch {
    examples = [];
  }
  return {
    id: String(row.id),
    title: row.title,
    pattern: row.pattern,
    explanation: row.explanation,
    level: row.level || "",
    examples
  };
}

// =====================
// 測驗
// =====================

function getQuizQuestions(params) {
  const type = params.type || "vocabulary";
  const level = params.level;
  const count = parseInt(params.count) || 10;

  let pool = [];

  if (type === "vocabulary") {
    const sheet = getSheet("Vocabulary");
    let rows = sheetToObjects(sheet);
    if (level) rows = rows.filter(r => r.level === level);
    pool = rows.map(r => buildVocabQuestion(r, rows));
  } else {
    const sheet = getSheet("Grammar");
    let rows = sheetToObjects(sheet);
    if (level) rows = rows.filter(r => r.level === level);
    pool = rows.map(r => buildGrammarQuestion(r, rows));
  }

  // 隨機抽取
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function buildVocabQuestion(row, allRows) {
  // 從其他單字取3個干擾選項
  const otherMeanings = allRows
    .filter(r => String(r.id) !== String(row.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(r => r.meaning);

  const options = [row.meaning, ...otherMeanings].sort(() => Math.random() - 0.5);

  return {
    id: String(row.id),
    type: "vocabulary",
    question: row.word + "（" + row.reading + "）的意思是？",
    options,
    answer: row.meaning
  };
}

function buildGrammarQuestion(row, allRows) {
  const otherTitles = allRows
    .filter(r => String(r.id) !== String(row.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(r => r.title);

  const options = [row.title, ...otherTitles].sort(() => Math.random() - 0.5);

  return {
    id: String(row.id),
    type: "grammar",
    question: "「" + row.pattern + "」是哪個文法的句型？",
    options,
    answer: row.title
  };
}

function submitAnswer(questionId, userAnswer) {
  // 先從單字找，再從文法找
  let correctAnswer = null;

  try {
    const vocabSheet = getSheet("Vocabulary");
    const vocabRows = sheetToObjects(vocabSheet);
    const vocabRow = vocabRows.find(r => String(r.id) === String(questionId));
    if (vocabRow) correctAnswer = vocabRow.meaning;
  } catch { /* 跳過 */ }

  if (!correctAnswer) {
    try {
      const grammarSheet = getSheet("Grammar");
      const grammarRows = sheetToObjects(grammarSheet);
      const grammarRow = grammarRows.find(r => String(r.id) === String(questionId));
      if (grammarRow) correctAnswer = grammarRow.title;
    } catch { /* 跳過 */ }
  }

  if (!correctAnswer) return { correct: false, explanation: "找不到題目" };

  const correct = userAnswer === correctAnswer;
  return {
    correct,
    explanation: correct ? "" : "正確答案是：" + correctAnswer
  };
}

// =====================
// 學習進度
// =====================

function getProgress() {
  const vocabTotal = getSheet("Vocabulary").getLastRow() - 1;
  const grammarTotal = getSheet("Grammar").getLastRow() - 1;

  const progressSheet = getSheet("Progress");
  const progressRows = sheetToObjects(progressSheet);
  const learnedWords = progressRows.filter(r => r.type === "word").length;
  const learnedGrammar = progressRows.filter(r => r.type === "grammar").length;

  const scoresSheet = getSheet("QuizScores");
  const scoreRows = sheetToObjects(scoresSheet);
  const quizScores = scoreRows.map(r => ({
    date: r.date,
    score: Math.round((r.score / r.total) * 100)
  }));

  return {
    learnedWords,
    totalWords: Math.max(vocabTotal, 0),
    learnedGrammar,
    totalGrammar: Math.max(grammarTotal, 0),
    quizScores
  };
}

function markLearned(type, id) {
  const sheet = getSheet("Progress");
  // 避免重複記錄
  const rows = sheetToObjects(sheet);
  const already = rows.find(r => r.type === type && String(r.id) === String(id));
  if (already) return { success: true };

  sheet.appendRow([type, id, new Date().toISOString()]);
  return { success: true };
}

function saveQuizScore(score, total) {
  const sheet = getSheet("QuizScores");
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  sheet.appendRow([score, total, date]);
  return { success: true };
}

// =====================
// 初始化工作表（第一次使用時執行）
// =====================

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Vocabulary
  if (!ss.getSheetByName("Vocabulary")) {
    const s = ss.insertSheet("Vocabulary");
    s.appendRow(["id", "word", "reading", "meaning", "level", "examples"]);
    // 範例資料
    s.appendRow(["1", "猫", "ねこ", "貓", "N5", "猫が好きです,あの猫はかわいい"]);
    s.appendRow(["2", "犬", "いぬ", "狗", "N5", "犬を飼っています"]);
    s.appendRow(["3", "食べる", "たべる", "吃", "N5", "ご飯を食べる"]);
  }

  // Grammar
  if (!ss.getSheetByName("Grammar")) {
    const s = ss.insertSheet("Grammar");
    s.appendRow(["id", "title", "pattern", "explanation", "level", "examples"]);
    // 範例資料（examples 為 JSON 陣列）
    s.appendRow([
      "1", "〜は〜です", "名詞 + は + 名詞 + です",
      "表示「...是...」，用於描述事物或人的基本狀態。", "N5",
      JSON.stringify([
        { japanese: "これは本です。", english: "This is a book." },
        { japanese: "わたしは学生です。", english: "I am a student." }
      ])
    ]);
    s.appendRow([
      "2", "〜が好きです", "名詞 + が + 好きです",
      "表示「喜歡...」。", "N5",
      JSON.stringify([
        { japanese: "音楽が好きです。", english: "I like music." }
      ])
    ]);
  }

  // Progress
  if (!ss.getSheetByName("Progress")) {
    const s = ss.insertSheet("Progress");
    s.appendRow(["type", "id", "learnedAt"]);
  }

  // QuizScores
  if (!ss.getSheetByName("QuizScores")) {
    const s = ss.insertSheet("QuizScores");
    s.appendRow(["score", "total", "date"]);
  }

  Logger.log("✅ 工作表初始化完成！");
}
