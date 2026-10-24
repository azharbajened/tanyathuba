/**
 * Database module — sql.js (pure JavaScript SQLite, no native build required)
 *
 * SECURITY NOTES:
 * - All queries use parameterised statements — SQL Injection prevention
 * - No dynamic SQL string construction whatsoever
 * - Database written to disk on every mutation (WAL not available in sql.js,
 *   so we persist immediately after write operations)
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'kajian.db');

let db = null; // sql.js Database instance

// ======================================================
// Bootstrap: load or create the database
// ======================================================
async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log(`[DB] Database dimuat dari: ${DB_PATH}`);
  } else {
    db = new SQL.Database();
    console.log(`[DB] Database baru dibuat di: ${DB_PATH}`);
  }

  // Schema
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id          INTEGER  PRIMARY KEY AUTOINCREMENT,
      name        TEXT     NOT NULL,
      question    TEXT     NOT NULL,
      status      TEXT     NOT NULL DEFAULT 'pending',
      ip_hash     TEXT,
      created_at  DATETIME NOT NULL DEFAULT (datetime('now')),
      answered_at DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_questions_status  ON questions(status);
    CREATE INDEX IF NOT EXISTS idx_questions_created ON questions(created_at);
    CREATE INDEX IF NOT EXISTS idx_questions_ip      ON questions(ip_hash, created_at);
  `);

  persist();
}

/** Persist in-memory database to disk after every write */
function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ======================================================
// Helper: run a single-row query with parameters (parameterised — no SQL injection)
// ======================================================
function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function runStmt(sql, params = []) {
  db.run(sql, params);
  persist();
}

// ======================================================
// Public API
// ======================================================
module.exports = {
  initDB,

  insertQuestion(name, question, ipHash) {
    db.run(
      'INSERT INTO questions (name, question, ip_hash) VALUES (?, ?, ?)',
      [name, question, ipHash]
    );
    persist();
    const row = queryOne('SELECT last_insert_rowid() AS id');
    return { lastInsertRowid: row ? row.id : null };
  },

  getAllQuestions(status) {
    if (status) {
      return queryAll(
        `SELECT id, name, question, status, created_at, answered_at
         FROM questions WHERE status = ? ORDER BY created_at ASC, id ASC`,
        [status]
      );
    }
    return queryAll(
      `SELECT id, name, question, status, created_at, answered_at
       FROM questions ORDER BY created_at ASC, id ASC`
    );
  },

  getQuestionById(id) {
    return queryOne(
      `SELECT id, name, question, status, created_at, answered_at
       FROM questions WHERE id = ?`,
      [id]
    );
  },

  markAnswered(id) {
    runStmt(
      `UPDATE questions SET status = 'answered', answered_at = datetime('now') WHERE id = ?`,
      [id]
    );
  },

  markPending(id) {
    runStmt(
      `UPDATE questions SET status = 'pending', answered_at = NULL WHERE id = ?`,
      [id]
    );
  },

  deleteQuestion(id) {
    runStmt('DELETE FROM questions WHERE id = ?', [id]);
  },

  getStats() {
    return queryOne(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) AS answered
      FROM questions
    `);
  },

  countByIpToday(ipHash) {
    const row = queryOne(
      `SELECT COUNT(*) AS count FROM questions
       WHERE ip_hash = ?
         AND created_at >= datetime('now', '-1 day')`,
      [ipHash]
    );
    return row ? row.count : 0;
  },
};
