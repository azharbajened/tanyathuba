/**
 * lib/db.js — Next.js Database Module
 *
 * Uses native Node.js SQLite (node:sqlite) when available (Node 22+),
 * or falls back to sql.js (SQLite WASM).
 *
 * OWASP A03 Injection Prevention:
 * - All queries use parameterised statements
 * - Direct database persistence on disk
 */

const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(process.cwd(), 'db');
const DB_PATH = path.join(DB_DIR, 'kajian.db');

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

// -------------------------------------------------------------
// Driver 1: Built-in Node.js SQLite (node:sqlite - Node 22+)
// -------------------------------------------------------------
let nodeSqliteDb = null;

try {
  const { DatabaseSync } = require('node:sqlite');
  ensureDir();
  nodeSqliteDb = new DatabaseSync(DB_PATH);
  nodeSqliteDb.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

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

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    INSERT OR IGNORE INTO settings (key, value) VALUES ('session_status', 'waiting');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('session_started_at', datetime('now'));
  `);
  resequenceQuestionsNode();
} catch (e) {
  nodeSqliteDb = null;
}

// -------------------------------------------------------------
// Driver 2: sql.js Fallback
// -------------------------------------------------------------
let sqlJsDb = null;
let initPromise = null;

async function getSqlJsDB() {
  if (sqlJsDb) return sqlJsDb;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    ensureDir();
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      sqlJsDb = new SQL.Database(fileBuffer);
    } else {
      sqlJsDb = new SQL.Database();
    }

    sqlJsDb.run(`
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

      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      INSERT OR IGNORE INTO settings (key, value) VALUES ('session_status', 'waiting');
      INSERT OR IGNORE INTO settings (key, value) VALUES ('session_started_at', datetime('now'));
    `);

    resequenceQuestionsSqlJs(sqlJsDb);
    persistSqlJs();
    return sqlJsDb;
  })();

  return initPromise;
}

function persistSqlJs() {
  if (!sqlJsDb) return;
  try {
    const data = sqlJsDb.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (err) {
    console.error('[DB] Failed to persist sql.js DB:', err);
  }
}

function queryOneSqlJs(database, sql, params = []) {
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

function queryAllSqlJs(database, sql, params = []) {
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function resequenceQuestionsNode() {
  if (!nodeSqliteDb) return;
  try {
    const rows = nodeSqliteDb.prepare('SELECT id FROM questions ORDER BY created_at ASC, id ASC').all();
    if (!rows || rows.length === 0) {
      try {
        nodeSqliteDb.prepare("DELETE FROM sqlite_sequence WHERE name = 'questions'").run();
      } catch (_) {}
      return;
    }
    const needsResequence = rows.some((r, idx) => Number(r.id) !== idx + 1);
    if (!needsResequence) {
      try {
        nodeSqliteDb.prepare("UPDATE sqlite_sequence SET seq = ? WHERE name = 'questions'").run(rows.length);
      } catch (_) {}
      return;
    }

    nodeSqliteDb.exec('BEGIN TRANSACTION');
    nodeSqliteDb.prepare('UPDATE questions SET id = -id').run();
    const updateStmt = nodeSqliteDb.prepare('UPDATE questions SET id = ? WHERE id = ?');
    rows.forEach((r, idx) => {
      updateStmt.run(idx + 1, -r.id);
    });
    try {
      nodeSqliteDb.prepare("UPDATE sqlite_sequence SET seq = ? WHERE name = 'questions'").run(rows.length);
    } catch (_) {}
    nodeSqliteDb.exec('COMMIT');
  } catch (err) {
    try { nodeSqliteDb.exec('ROLLBACK'); } catch (_) {}
    console.error('[DB] Resequence Node error:', err);
  }
}

function resequenceQuestionsSqlJs(database) {
  if (!database) return;
  try {
    const rows = queryAllSqlJs(database, 'SELECT id FROM questions ORDER BY created_at ASC, id ASC');
    if (!rows || rows.length === 0) {
      try {
        database.run("DELETE FROM sqlite_sequence WHERE name = 'questions'");
      } catch (_) {}
      return;
    }
    const needsResequence = rows.some((r, idx) => Number(r.id) !== idx + 1);
    if (!needsResequence) {
      try {
        database.run("UPDATE sqlite_sequence SET seq = ? WHERE name = 'questions'", [rows.length]);
      } catch (_) {}
      return;
    }

    database.run('BEGIN TRANSACTION');
    database.run('UPDATE questions SET id = -id');
    rows.forEach((r, idx) => {
      database.run('UPDATE questions SET id = ? WHERE id = ?', [idx + 1, -r.id]);
    });
    try {
      database.run("UPDATE sqlite_sequence SET seq = ? WHERE name = 'questions'", [rows.length]);
    } catch (_) {}
    database.run('COMMIT');
  } catch (err) {
    try { database.run('ROLLBACK'); } catch (_) {}
    console.error('[DB] Resequence sql.js error:', err);
  }
}

function resetSequenceIfEmptyNode() {
  resequenceQuestionsNode();
}

function resetSequenceIfEmptySqlJs(database) {
  resequenceQuestionsSqlJs(database);
}

// -------------------------------------------------------------
// Unified Database Interface
// -------------------------------------------------------------
module.exports = {
  async insertQuestion(name, question, ipHash) {
    if (nodeSqliteDb) {
      resetSequenceIfEmptyNode();
      const stmt = nodeSqliteDb.prepare(
        'INSERT INTO questions (name, question, ip_hash) VALUES (?, ?, ?)'
      );
      const info = stmt.run(name, question, ipHash);
      return { lastInsertRowid: Number(info.lastInsertRowid) };
    }

    const database = await getSqlJsDB();
    resetSequenceIfEmptySqlJs(database);
    database.run(
      'INSERT INTO questions (name, question, ip_hash) VALUES (?, ?, ?)',
      [name, question, ipHash]
    );
    persistSqlJs();
    const row = queryOneSqlJs(database, 'SELECT last_insert_rowid() AS id');
    return { lastInsertRowid: row ? row.id : null };
  },

  async getAllQuestions(status) {
    if (nodeSqliteDb) {
      if (status) {
        return nodeSqliteDb
          .prepare(
            `SELECT id, name, question, status, created_at, answered_at
             FROM questions WHERE status = ? ORDER BY created_at ASC, id ASC`
          )
          .all(status);
      }
      return nodeSqliteDb
        .prepare(
          `SELECT id, name, question, status, created_at, answered_at
           FROM questions ORDER BY created_at ASC, id ASC`
        )
        .all();
    }

    const database = await getSqlJsDB();
    if (status) {
      return queryAllSqlJs(
        database,
        `SELECT id, name, question, status, created_at, answered_at
         FROM questions WHERE status = ? ORDER BY created_at ASC, id ASC`,
        [status]
      );
    }
    return queryAllSqlJs(
      database,
      `SELECT id, name, question, status, created_at, answered_at
       FROM questions ORDER BY created_at ASC, id ASC`
    );
  },

  async getQuestionById(id) {
    if (nodeSqliteDb) {
      return nodeSqliteDb
        .prepare(
          `SELECT id, name, question, status, created_at, answered_at
           FROM questions WHERE id = ?`
        )
        .get(id);
    }

    const database = await getSqlJsDB();
    return queryOneSqlJs(
      database,
      `SELECT id, name, question, status, created_at, answered_at
       FROM questions WHERE id = ?`,
      [id]
    );
  },

  async markAnswered(id) {
    if (nodeSqliteDb) {
      nodeSqliteDb
        .prepare(
          `UPDATE questions SET status = 'answered', answered_at = datetime('now') WHERE id = ?`
        )
        .run(id);
      return;
    }

    const database = await getSqlJsDB();
    database.run(
      `UPDATE questions SET status = 'answered', answered_at = datetime('now') WHERE id = ?`,
      [id]
    );
    persistSqlJs();
  },

  async markPending(id) {
    if (nodeSqliteDb) {
      nodeSqliteDb
        .prepare(
          `UPDATE questions SET status = 'pending', answered_at = NULL WHERE id = ?`
        )
        .run(id);
      return;
    }

    const database = await getSqlJsDB();
    database.run(
      `UPDATE questions SET status = 'pending', answered_at = NULL WHERE id = ?`,
      [id]
    );
    persistSqlJs();
  },

  async deleteQuestion(id) {
    if (nodeSqliteDb) {
      nodeSqliteDb.prepare('DELETE FROM questions WHERE id = ?').run(id);
      resetSequenceIfEmptyNode();
      return;
    }

    const database = await getSqlJsDB();
    database.run('DELETE FROM questions WHERE id = ?', [id]);
    resetSequenceIfEmptySqlJs(database);
    persistSqlJs();
  },

  async bulkMarkAnswered(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    if (nodeSqliteDb) {
      nodeSqliteDb
        .prepare(
          `UPDATE questions SET status = 'answered', answered_at = datetime('now') WHERE id IN (${placeholders})`
        )
        .run(...ids);
      return;
    }

    const database = await getSqlJsDB();
    database.run(
      `UPDATE questions SET status = 'answered', answered_at = datetime('now') WHERE id IN (${placeholders})`,
      ids
    );
    persistSqlJs();
  },

  async bulkMarkPending(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    if (nodeSqliteDb) {
      nodeSqliteDb
        .prepare(
          `UPDATE questions SET status = 'pending', answered_at = NULL WHERE id IN (${placeholders})`
        )
        .run(...ids);
      return;
    }

    const database = await getSqlJsDB();
    database.run(
      `UPDATE questions SET status = 'pending', answered_at = NULL WHERE id IN (${placeholders})`,
      ids
    );
    persistSqlJs();
  },

  async bulkDeleteQuestions(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    if (nodeSqliteDb) {
      nodeSqliteDb
        .prepare(`DELETE FROM questions WHERE id IN (${placeholders})`)
        .run(...ids);
      resetSequenceIfEmptyNode();
      return;
    }

    const database = await getSqlJsDB();
    database.run(`DELETE FROM questions WHERE id IN (${placeholders})`, ids);
    resetSequenceIfEmptySqlJs(database);
    persistSqlJs();
  },

  async clearAllQuestions() {
    if (nodeSqliteDb) {
      nodeSqliteDb.prepare('DELETE FROM questions').run();
      try {
        nodeSqliteDb.prepare("DELETE FROM sqlite_sequence WHERE name = 'questions'").run();
      } catch (_) {}
      try {
        nodeSqliteDb.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('session_started_at', datetime('now'))").run();
      } catch (_) {}
      return;
    }

    const database = await getSqlJsDB();
    database.run('DELETE FROM questions');
    try {
      database.run("DELETE FROM sqlite_sequence WHERE name = 'questions'");
    } catch (_) {}
    try {
      database.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('session_started_at', datetime('now'))");
    } catch (_) {}
    persistSqlJs();
  },

  async getStats() {
    if (nodeSqliteDb) {
      const stats = nodeSqliteDb
        .prepare(
          `SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) AS answered
          FROM questions`
        )
        .get();
      return {
        total: Number(stats?.total || 0),
        pending: Number(stats?.pending || 0),
        answered: Number(stats?.answered || 0),
      };
    }

    const database = await getSqlJsDB();
    const stats = queryOneSqlJs(
      database,
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) AS answered
      FROM questions`
    );
    return {
      total: Number(stats?.total || 0),
      pending: Number(stats?.pending || 0),
      answered: Number(stats?.answered || 0),
    };
  },

  async countByIpToday(ipHash) {
    if (nodeSqliteDb) {
      const row = nodeSqliteDb
        .prepare(
          `SELECT COUNT(*) AS count FROM questions
           WHERE ip_hash = ?
             AND created_at >= datetime('now', '-1 day')`
        )
        .get(ipHash);
      return Number(row ? row.count : 0);
    }

    const database = await getSqlJsDB();
    const row = queryOneSqlJs(
      database,
      `SELECT COUNT(*) AS count FROM questions
       WHERE ip_hash = ?
         AND created_at >= datetime('now', '-1 day')`,
      [ipHash]
    );
    return Number(row ? row.count : 0);
  },

  async countByIpRecent(ipHash, minutes = 15) {
    if (!ipHash) return 0;
    const modifier = `-${parseInt(minutes, 10) || 15} minutes`;
    if (nodeSqliteDb) {
      try {
        const row = nodeSqliteDb
          .prepare(
            `SELECT COUNT(*) AS count FROM questions
             WHERE ip_hash = ?
               AND created_at >= datetime('now', ?)`
          )
          .get(ipHash, modifier);
        return Number(row?.count || 0);
      } catch (err) {
        console.error('[DB] countByIpRecent error:', err);
        return 0;
      }
    }

    const database = await getSqlJsDB();
    try {
      const row = queryOneSqlJs(
        database,
        `SELECT COUNT(*) AS count FROM questions
         WHERE ip_hash = ?
           AND created_at >= datetime('now', ?)`,
        [ipHash, modifier]
      );
      return Number(row ? row.count : 0);
    } catch (err) {
      console.error('[DB] countByIpRecent sql.js error:', err);
      return 0;
    }
  },

  /**
   * 2-Tier Question Rate Limiter (Session-Based, NAT-Safe):
   * 1. Jeda 5 menit setelah submit pertanyaan ke-1 pada sesi browser yang sama
   * 2. Maksimal 2 pertanyaan per jam per sesi browser
   * 3. Jika sudah mencapai 2 pertanyaan, tahan (hold) selama 1 jam pada sesi tersebut
   * 4. Otomatis reset jika admin memulai sesi kajian baru (session_started_at)
   */
  async checkQuestionRateLimit(sessionHash) {
    if (!sessionHash) {
      return { allowed: true, currentCount: 0, cooldownRemainingSeconds: 0, holdRemainingSeconds: 0 };
    }

    const query = `
      SELECT id, created_at,
             CAST((strftime('%s', 'now') - strftime('%s', created_at)) AS INTEGER) AS elapsed_seconds
      FROM questions
      WHERE ip_hash = ?
        AND created_at >= datetime('now', '-60 minutes')
        AND created_at >= COALESCE(
          (SELECT value FROM settings WHERE key = 'session_started_at'),
          datetime('now', '-60 minutes')
        )
      ORDER BY created_at ASC
    `;

    let rows = [];
    if (nodeSqliteDb) {
      try {
        rows = nodeSqliteDb.prepare(query).all(sessionHash);
      } catch (err) {
        console.error('[DB] checkQuestionRateLimit error:', err);
        rows = [];
      }
    } else {
      const database = await getSqlJsDB();
      try {
        rows = queryAllSqlJs(database, query, [sessionHash]);
      } catch (err) {
        console.error('[DB] checkQuestionRateLimit sql.js error:', err);
        rows = [];
      }
    }

    const count = rows ? rows.length : 0;

    // Rule: Jika sudah submit 2 pertanyaan atau lebih dalam 60 menit -> HOLD 1 JAM dari pertanyaan terakhir
    if (count >= 2) {
      const latestRow = rows[rows.length - 1];
      const elapsed = Number(latestRow?.elapsed_seconds || 0);
      const holdRemaining = Math.max(0, 3600 - elapsed);

      if (holdRemaining > 0) {
        const remainingMinutes = Math.ceil(holdRemaining / 60);
        return {
          allowed: false,
          reason: 'HOLD_1_HOUR',
          currentCount: count,
          holdRemainingSeconds: holdRemaining,
          cooldownRemainingSeconds: 0,
          message: `Batas pengiriman maksimal 2 pertanyaan telah tercapai. Anda dapat mengirim pertanyaan kembali setelah 1 jam (sisa waktu: ${remainingMinutes} menit).`,
        };
      }
    }

    // Rule: Jika sudah submit 1 pertanyaan -> DELAY 5 MENIT sebelum pertanyaan ke-2
    if (count === 1) {
      const firstRow = rows[0];
      const elapsed = Number(firstRow?.elapsed_seconds || 0);
      const cooldownRemaining = Math.max(0, 300 - elapsed);

      if (cooldownRemaining > 0) {
        const mins = Math.floor(cooldownRemaining / 60);
        const secs = cooldownRemaining % 60;
        const timeText = mins > 0 ? `${mins} menit ${secs} detik` : `${secs} detik`;
        return {
          allowed: false,
          reason: 'COOLDOWN_ACTIVE',
          currentCount: 1,
          cooldownRemainingSeconds: cooldownRemaining,
          holdRemainingSeconds: 0,
          message: `Mohon tunggu jeda 5 menit antar pertanyaan. Anda dapat mengirim pertanyaan ke-2 dalam ${timeText} lagi.`,
        };
      }

      return {
        allowed: true,
        currentCount: 1,
        questionNumber: 2,
        cooldownRemainingSeconds: 0,
        holdRemainingSeconds: 0,
      };
    }

    // Belum pernah submit dalam 60 menit terakhir -> Boleh submit pertanyaan ke-1
    return {
      allowed: true,
      currentCount: 0,
      questionNumber: 1,
      cooldownRemainingSeconds: 0,
      holdRemainingSeconds: 0,
    };
  },

  async getSessionStatus() {
    if (nodeSqliteDb) {
      try {
        const row = nodeSqliteDb.prepare("SELECT value FROM settings WHERE key = 'session_status'").get();
        return row?.value || 'waiting';
      } catch (_) {
        return 'waiting';
      }
    }

    const database = await getSqlJsDB();
    const row = queryOneSqlJs(database, "SELECT value FROM settings WHERE key = 'session_status'");
    return row?.value || 'waiting';
  },

  async countQuestionsByIpInCurrentSession(ipHash) {
    if (!ipHash) return 0;
    if (nodeSqliteDb) {
      try {
        const row = nodeSqliteDb
          .prepare(
            `SELECT COUNT(*) AS count FROM questions
             WHERE ip_hash = ?
               AND created_at >= COALESCE(
                 (SELECT value FROM settings WHERE key = 'session_started_at'),
                 datetime('now', '-1 day')
               )`
          )
          .get(ipHash);
        return Number(row?.count || 0);
      } catch (err) {
        console.error('[DB] countQuestionsByIpInCurrentSession error:', err);
        return 0;
      }
    }

    const database = await getSqlJsDB();
    try {
      const row = queryOneSqlJs(
        database,
        `SELECT COUNT(*) AS count FROM questions
         WHERE ip_hash = ?
           AND created_at >= COALESCE(
             (SELECT value FROM settings WHERE key = 'session_started_at'),
             datetime('now', '-1 day')
           )`,
        [ipHash]
      );
      return Number(row ? row.count : 0);
    } catch (err) {
      console.error('[DB] countQuestionsByIpInCurrentSession sql.js error:', err);
      return 0;
    }
  },

  async setSessionStatus(status) {
    if (!['waiting', 'active', 'ended'].includes(status)) {
      throw new Error('Status sesi tidak valid');
    }

    const currentStatus = await this.getSessionStatus();
    const isNewActiveSession = status === 'active' && currentStatus !== 'active';

    if (nodeSqliteDb) {
      if (isNewActiveSession) {
        try {
          nodeSqliteDb
            .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('session_started_at', datetime('now'))")
            .run();
        } catch (_) {}
      }
      nodeSqliteDb
        .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('session_status', ?)")
        .run(status);
      return status;
    }

    const database = await getSqlJsDB();
    if (isNewActiveSession) {
      try {
        database.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('session_started_at', datetime('now'))");
      } catch (_) {}
    }
    database.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('session_status', ?)", [status]);
    persistSqlJs();
    return status;
  },
};
