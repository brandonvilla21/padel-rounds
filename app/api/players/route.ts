import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function ensureTable() {
    await db.execute(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1 TEXT NOT NULL,
      player2 TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function GET() {
    try {
        await ensureTable();
        const result = await db.execute('SELECT * FROM players ORDER BY id ASC');
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await ensureTable();
        const body = await request.json();
        const { player1, player2 } = body;

        if (!player1 || !player2) {
            return NextResponse.json({ error: 'Both player names are required' }, { status: 400 });
        }

        const result = await db.execute({
            sql: 'INSERT INTO players (player1, player2) VALUES (?, ?)',
            args: [player1, player2],
        });

        // lastInsertRowid is available in the result.lastInsertRowid for LibSQL
        // Note: depending on the adapter/client version, it might be string or bigint or number.
        const id = result.lastInsertRowid?.toString();

        return NextResponse.json({ id, player1, player2 }, { status: 201 });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to add players' }, { status: 500 });
    }
}
