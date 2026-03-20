// nihongo-study - Google Apps Script 後端（ES5 相容版本）
// 工作表1「Vocabulary」: id | word | reading | meaning | level | book | lesson | examples(逗號分隔)
// 工作表2「Grammar」:    id | title | pattern | explanation | level | examples(JSON)
// 工作表3「Progress」:   type | id | learnedAt
// 工作表4「QuizScores」: score | total | date

function doGet(e) {
  try {
    var action = e.parameter.action;
    var result;
    if (action === "getVocabulary") {
      result = getVocabulary(e.parameter);
    } else if (action === "getLessons") {
      result = getLessons(e.parameter.book);
    } else if (action === "getVocabularyById") {
      result = getVocabularyById(e.parameter.id);
    } else if (action === "getGrammar") {
      result = getGrammar(e.parameter);
    } else if (action === "getGrammarById") {
      result = getGrammarById(e.parameter.id);
    } else if (action === "getQuizQuestions") {
      result = getQuizQuestions(e.parameter);
    } else if (action === "getProgress") {
      result = getProgress();
    } else {
      result = { error: "Unknown action: " + action };
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var result;
    if (action === "submitAnswer") {
      result = submitAnswer(body.questionId, body.answer);
    } else if (action === "markLearned") {
      result = markLearned(body.type, body.id);
    } else if (action === "saveQuizScore") {
      result = saveQuizScore(body.score, body.total);
    } else {
      result = { error: "Unknown action: " + action };
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error("找不到工作表：" + name);
  return sheet;
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return result;
}

// ---- 單字 ----

function getVocabulary(params) {
  var sheet = getSheet("Vocabulary");
  var rows = sheetToObjects(sheet);
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (params.level && r.level !== params.level) continue;
    if (params.book && r.book !== params.book) continue;
    if (params.lesson && r.lesson !== params.lesson) continue;
    if (params.search) {
      var q = params.search.toLowerCase();
      var match = String(r.word).toLowerCase().indexOf(q) >= 0 ||
                  String(r.reading).toLowerCase().indexOf(q) >= 0 ||
                  String(r.meaning).toLowerCase().indexOf(q) >= 0;
      if (!match) continue;
    }
    result.push(formatVocabulary(r));
  }
  return result;
}

function getLessons(book) {
  var sheet = getSheet("Vocabulary");
  var rows = sheetToObjects(sheet);
  var lessonList = [];
  var seen = {};
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (book && r.book !== book) continue;
    if (r.lesson && !seen[r.lesson]) {
      seen[r.lesson] = true;
      lessonList.push(r.lesson);
    }
  }
  lessonList.sort(function(a, b) {
    var na = parseInt(String(a).replace(/[^0-9]/g, "")) || 0;
    var nb = parseInt(String(b).replace(/[^0-9]/g, "")) || 0;
    return na - nb;
  });
  return lessonList;
}

function getVocabularyById(id) {
  var rows = sheetToObjects(getSheet("Vocabulary"));
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(id)) return formatVocabulary(rows[i]);
  }
  throw new Error("找不到單字 id: " + id);
}

function formatVocabulary(row) {
  var examples = [];
  if (row.examples) {
    var parts = String(row.examples).split(",");
    for (var i = 0; i < parts.length; i++) {
      var s = parts[i].replace(/^\s+|\s+$/g, "");
      if (s) examples.push(s);
    }
  }
  return {
    id: String(row.id),
    word: row.word,
    reading: row.reading,
    meaning: row.meaning,
    level: row.level || "",
    book: row.book || "",
    lesson: row.lesson || "",
    examples: examples
  };
}

// ---- 文法 ----

function getGrammar(params) {
  var sheet = getSheet("Grammar");
  var rows = sheetToObjects(sheet);
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (params.level && r.level !== params.level) continue;
    if (params.search) {
      var q = params.search.toLowerCase();
      var match = String(r.title).toLowerCase().indexOf(q) >= 0 ||
                  String(r.pattern).toLowerCase().indexOf(q) >= 0 ||
                  String(r.explanation).toLowerCase().indexOf(q) >= 0;
      if (!match) continue;
    }
    result.push(formatGrammar(r));
  }
  return result;
}

function getGrammarById(id) {
  var rows = sheetToObjects(getSheet("Grammar"));
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(id)) return formatGrammar(rows[i]);
  }
  throw new Error("找不到文法 id: " + id);
}

function formatGrammar(row) {
  var examples = [];
  try {
    if (row.examples) examples = JSON.parse(row.examples);
  } catch (e) {
    examples = [];
  }
  return {
    id: String(row.id),
    title: row.title,
    pattern: row.pattern,
    explanation: row.explanation,
    level: row.level || "",
    examples: examples
  };
}

// ---- 測驗 ----

function getQuizQuestions(params) {
  var type = params.type || "vocabulary";
  var level = params.level;
  var count = parseInt(params.count) || 10;
  var pool = [];

  if (type === "vocabulary") {
    var rows = sheetToObjects(getSheet("Vocabulary"));
    var filtered = [];
    for (var i = 0; i < rows.length; i++) {
      if (!level || rows[i].level === level) filtered.push(rows[i]);
    }
    for (var i = 0; i < filtered.length; i++) {
      pool.push(buildVocabQuestion(filtered[i], filtered));
    }
  } else {
    var rows = sheetToObjects(getSheet("Grammar"));
    var filtered = [];
    for (var i = 0; i < rows.length; i++) {
      if (!level || rows[i].level === level) filtered.push(rows[i]);
    }
    for (var i = 0; i < filtered.length; i++) {
      pool.push(buildGrammarQuestion(filtered[i], filtered));
    }
  }

  pool.sort(function() { return Math.random() - 0.5; });
  return pool.slice(0, count);
}

function buildVocabQuestion(row, allRows) {
  var others = [];
  for (var i = 0; i < allRows.length; i++) {
    if (String(allRows[i].id) !== String(row.id)) others.push(allRows[i].meaning);
  }
  others.sort(function() { return Math.random() - 0.5; });
  var options = [row.meaning, others[0] || "?", others[1] || "?", others[2] || "?"];
  options.sort(function() { return Math.random() - 0.5; });
  return {
    id: String(row.id),
    type: "vocabulary",
    question: row.reading,
    word: row.word,
    options: options,
    answer: row.meaning
  };
}

function buildGrammarQuestion(row, allRows) {
  var others = [];
  for (var i = 0; i < allRows.length; i++) {
    if (String(allRows[i].id) !== String(row.id)) others.push(allRows[i].title);
  }
  others.sort(function() { return Math.random() - 0.5; });
  var options = [row.title, others[0] || "?", others[1] || "?", others[2] || "?"];
  options.sort(function() { return Math.random() - 0.5; });
  return {
    id: String(row.id),
    type: "grammar",
    question: "「" + row.pattern + "」是哪個文法的句型？",
    options: options,
    answer: row.title
  };
}

function submitAnswer(questionId, userAnswer) {
  var correctAnswer = null;
  try {
    var vocabRows = sheetToObjects(getSheet("Vocabulary"));
    for (var i = 0; i < vocabRows.length; i++) {
      if (String(vocabRows[i].id) === String(questionId)) {
        correctAnswer = vocabRows[i].meaning;
        break;
      }
    }
  } catch (e) {}

  if (!correctAnswer) {
    try {
      var grammarRows = sheetToObjects(getSheet("Grammar"));
      for (var i = 0; i < grammarRows.length; i++) {
        if (String(grammarRows[i].id) === String(questionId)) {
          correctAnswer = grammarRows[i].title;
          break;
        }
      }
    } catch (e) {}
  }

  if (!correctAnswer) return { correct: false, explanation: "找不到題目" };
  var correct = userAnswer === correctAnswer;
  return {
    correct: correct,
    explanation: correct ? "" : "正確答案是：" + correctAnswer
  };
}

// ---- 進度 ----

function getProgress() {
  var vocabTotal = getSheet("Vocabulary").getLastRow() - 1;
  var grammarTotal = getSheet("Grammar").getLastRow() - 1;
  var progressRows = sheetToObjects(getSheet("Progress"));
  var learnedWords = 0;
  var learnedGrammar = 0;
  for (var i = 0; i < progressRows.length; i++) {
    if (progressRows[i].type === "word") learnedWords++;
    if (progressRows[i].type === "grammar") learnedGrammar++;
  }
  var scoreRows = sheetToObjects(getSheet("QuizScores"));
  var quizScores = [];
  for (var i = 0; i < scoreRows.length; i++) {
    quizScores.push({
      date: scoreRows[i].date,
      score: Math.round((scoreRows[i].score / scoreRows[i].total) * 100)
    });
  }
  return {
    learnedWords: learnedWords,
    totalWords: Math.max(vocabTotal, 0),
    learnedGrammar: learnedGrammar,
    totalGrammar: Math.max(grammarTotal, 0),
    quizScores: quizScores
  };
}

function markLearned(type, id) {
  var sheet = getSheet("Progress");
  var rows = sheetToObjects(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].type === type && String(rows[i].id) === String(id)) {
      return { success: true };
    }
  }
  sheet.appendRow([type, id, new Date().toISOString()]);
  return { success: true };
}

function saveQuizScore(score, total) {
  var sheet = getSheet("QuizScores");
  var date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  sheet.appendRow([score, total, date]);
  return { success: true };
}

// ---- 初始化（第一次使用時執行）----

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss.getSheetByName("Vocabulary")) {
    var s = ss.insertSheet("Vocabulary");
    s.appendRow(["id", "word", "reading", "meaning", "level", "book", "lesson", "examples"]);
    s.appendRow(["1", "わたし", "わたし", "我", "N5", "初級1", "第1課", ""]);
    s.appendRow(["2", "あなた", "あなた", "你", "N5", "初級1", "第1課", ""]);
    s.appendRow(["3", "がくせい", "がくせい", "學生", "N5", "初級1", "第1課", ""]);
    s.appendRow(["4", "せんせい", "せんせい", "老師", "N5", "初級1", "第1課", ""]);
    s.appendRow(["5", "くに", "くに", "國家", "N5", "初級1", "第2課", ""]);
    s.appendRow(["6", "ほん", "ほん", "書", "N5", "初級1", "第2課", ""]);
  }

  if (!ss.getSheetByName("Grammar")) {
    var s = ss.insertSheet("Grammar");
    s.appendRow(["id", "title", "pattern", "explanation", "level", "examples"]);
    s.appendRow(["1", "〜は〜です", "名詞 + は + 名詞 + です", "表示「...是...」，用於描述事物或人的基本狀態。", "N5",
      '[{"japanese":"これは本です。","english":"This is a book."},{"japanese":"わたしは学生です。","english":"I am a student."}]']);
    s.appendRow(["2", "〜が好きです", "名詞 + が + 好きです", "表示「喜歡...」。", "N5",
      '[{"japanese":"音楽が好きです。","english":"I like music."}]']);
  }

  if (!ss.getSheetByName("Progress")) {
    var s = ss.insertSheet("Progress");
    s.appendRow(["type", "id", "learnedAt"]);
  }

  if (!ss.getSheetByName("QuizScores")) {
    var s = ss.insertSheet("QuizScores");
    s.appendRow(["score", "total", "date"]);
  }

  Logger.log("工作表初始化完成！");
}
