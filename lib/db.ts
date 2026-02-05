import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'file:padel-rounds.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({
  url,
  authToken,
});

export async function ensureSchema() {
  // Create rounds table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // Migration: Add round_slug column if it doesn't exist (for existing databases)
  try {
    const tableInfo = await db.execute("PRAGMA table_info(players)");
    const hasRoundSlug = tableInfo.rows.some(row => row.name === 'round_slug');

    if (!hasRoundSlug) {
      await db.execute("ALTER TABLE players ADD COLUMN round_slug TEXT");
      // Optional: Assign existing players to a default round if needed, or leave null
    }
  } catch (e) {
    // Ignore error if column already exists or other safe failures
    console.log("Schema check/migration note:", e);
  }
}
