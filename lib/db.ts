import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'file:padel-rounds.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({
  url,
  authToken,
});

export async function ensureSchema() {
  // Create users table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create rounds table with user_id
  await db.execute(`
    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      max_pairs INTEGER,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Create players table with round_slug
  await db.execute(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1 TEXT NOT NULL,
      player2 TEXT NOT NULL,
      round_slug TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(round_slug) REFERENCES rounds(slug)
    )
  `);

  // Create matches table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round_slug TEXT NOT NULL,
      pair1_id INTEGER NOT NULL,
      pair2_id INTEGER NOT NULL,
      score1 INTEGER DEFAULT 0,
      score2 INTEGER DEFAULT 0,
      played BOOLEAN DEFAULT 0,
      match_round INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(round_slug) REFERENCES rounds(slug),
      FOREIGN KEY(pair1_id) REFERENCES players(id),
      FOREIGN KEY(pair2_id) REFERENCES players(id)
    )
  `);

  // Migration: Add columns if they don't exist
  try {
    const tableInfo = await db.execute("PRAGMA table_info(players)");
    const hasRoundSlug = tableInfo.rows.some(row => row.name === 'round_slug');

    if (!hasRoundSlug) {
      await db.execute("ALTER TABLE players ADD COLUMN round_slug TEXT");
    }

    const roundsInfo = await db.execute("PRAGMA table_info(rounds)");
    const hasMaxPairs = roundsInfo.rows.some(row => row.name === 'max_pairs');
    const hasUserId = roundsInfo.rows.some(row => row.name === 'user_id');

    if (!hasMaxPairs) {
      await db.execute("ALTER TABLE rounds ADD COLUMN max_pairs INTEGER");
    }

    if (!hasUserId) {
      await db.execute("ALTER TABLE rounds ADD COLUMN user_id INTEGER");
    }

    const matchesInfo = await db.execute("PRAGMA table_info(matches)");
    const hasMatchRound = matchesInfo.rows.some(row => row.name === 'match_round');

    if (!hasMatchRound) {
      await db.execute("ALTER TABLE matches ADD COLUMN match_round INTEGER DEFAULT 1");
    }
  } catch (e) {
    console.log("Schema check/migration note:", e);
  }
}
