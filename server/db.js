const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'storage');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(process.env.DB_FILE || path.join(DATA_DIR, 'vgt.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher','admin')),
  college TEXT,
  group_name TEXT,
  course INTEGER,
  specialty TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  order_no INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  hours INTEGER,
  summary TEXT,
  objectives TEXT NOT NULL DEFAULT '[]',
  content TEXT NOT NULL DEFAULT '',
  keywords TEXT NOT NULL DEFAULT '[]',
  methods TEXT NOT NULL DEFAULT '[]',
  quiz TEXT NOT NULL DEFAULT '[]',
  practice TEXT NOT NULL DEFAULT '[]',
  resources TEXT NOT NULL DEFAULT '[]',
  is_published INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS topic_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'started',
  quiz_score REAL,
  quiz_best REAL,
  quiz_attempts INTEGER NOT NULL DEFAULT 0,
  time_spent_sec INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  PRIMARY KEY (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS method_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  method_key TEXT NOT NULL,
  method_type TEXT NOT NULL,
  response TEXT NOT NULL,
  score REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, topic_id, method_key)
);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'mustaqil',
  group_name TEXT,
  due_date TEXT,
  max_score INTEGER NOT NULL DEFAULT 10,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer_text TEXT,
  link TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  score REAL,
  feedback TEXT,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  graded_at TEXT,
  UNIQUE (assignment_id, user_id)
);

CREATE TABLE IF NOT EXISTS study_plan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  due_date TEXT,
  done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'other',
  audience TEXT NOT NULL DEFAULT 'student' CHECK (audience IN ('student','teacher','all')),
  questions TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  allow_multiple INTEGER NOT NULL DEFAULT 0,
  pair_slug TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);

CREATE TABLE IF NOT EXISTS trainer_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'uz',
  mode TEXT NOT NULL DEFAULT 'ai',
  messages TEXT NOT NULL DEFAULT '[]',
  events_fired TEXT NOT NULL DEFAULT '[]',
  hints_used INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  score_total REAL,
  scores TEXT,
  feedback TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT,
  duration_sec INTEGER
);
CREATE INDEX IF NOT EXISTS idx_trainer_user ON trainer_sessions(user_id);
`);

const json = {
  parse(v, fallback) {
    if (v == null) return fallback;
    try { return JSON.parse(v); } catch { return fallback; }
  },
};

function seed() {
  const { topics } = require('../data/topics');
  const { surveys } = require('../data/surveys');

  const insTopic = db.prepare(`INSERT OR IGNORE INTO topics
    (slug, module, order_no, title, hours, summary, objectives, content, keywords, methods, quiz, practice, resources)
    VALUES (@slug, @module, @order_no, @title, @hours, @summary, @objectives, @content, @keywords, @methods, @quiz, @practice, @resources)`);
  const insAssign = db.prepare(`INSERT INTO assignments (topic_id, title, description, kind, max_score)
    SELECT ?, ?, ?, 'mustaqil', ? WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE topic_id = ? AND title = ?)`);

  db.transaction(() => {
    topics.forEach((t, i) => {
      const r = insTopic.run({
        slug: t.slug,
        module: t.module,
        order_no: i + 1,
        title: t.title,
        hours: t.hours || 2,
        summary: t.summary || '',
        objectives: JSON.stringify(t.objectives || []),
        content: t.content || '',
        keywords: JSON.stringify(t.keywords || []),
        methods: JSON.stringify(t.methods || []),
        quiz: JSON.stringify(t.quiz || []),
        practice: JSON.stringify(t.practice || []),
        resources: JSON.stringify(t.resources || []),
      });
      if (r.changes) {
        const topicId = r.lastInsertRowid;
        for (const s of t.selfstudy || []) {
          insAssign.run(topicId, s.title, s.description, s.max_score || 10, topicId, s.title);
        }
      }
    });

    const insSurvey = db.prepare(`INSERT OR IGNORE INTO surveys
      (slug, title, description, kind, audience, questions, allow_multiple, pair_slug)
      VALUES (@slug, @title, @description, @kind, @audience, @questions, @allow_multiple, @pair_slug)`);
    for (const s of surveys) {
      insSurvey.run({
        slug: s.slug,
        title: s.title,
        description: s.description || '',
        kind: s.kind || 'other',
        audience: s.audience || 'student',
        questions: JSON.stringify(s.questions),
        allow_multiple: s.allow_multiple ? 1 : 0,
        pair_slug: s.pair_slug || null,
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@vgt.uz';
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    if (!exists) {
      const pwd = process.env.ADMIN_PASSWORD || 'admin12345';
      db.prepare(`INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'admin')`)
        .run(adminEmail, bcrypt.hashSync(pwd, 10), 'Platforma administratori');
      if (!process.env.ADMIN_PASSWORD) {
        console.warn(`[seed] Admin yaratildi: ${adminEmail} / ${pwd} — parolni darhol almashtiring!`);
      }
    }
  })();
}

seed();

module.exports = { db, json };
