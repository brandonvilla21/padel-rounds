import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';

export async function GET(request: Request) {
    try {
        await ensureSchema();
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        let query = 'SELECT * FROM players';
        const args: any[] = [];

        if (slug) {
            query += ' WHERE round_slug = ?';
            args.push(slug);
        }

        query += ' ORDER BY id ASC';

        const result = await db.execute({ sql: query, args });
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await ensureSchema();
        const body = await request.json();
        const { player1, player2, slug } = body;

        if (!player1 || !player2) {
            return NextResponse.json({ error: 'Both player names are required' }, { status: 400 });
        }

        // Checking if the round exists is good practice, but for now we might rely on UI
        // Or we implicitly create it? No, Admin creates rounds. 
        // If slug is provided, check existence?
        // Let's assume slug comes from a valid page.

        if (!slug) {
            return NextResponse.json({ error: 'Round slug is required' }, { status: 400 });
        }

        // Check availability and existence strictly
        const roundRes = await db.execute({
            sql: 'SELECT max_pairs, (SELECT COUNT(*) FROM players WHERE round_slug = ?) as current_count FROM rounds WHERE slug = ?',
            args: [slug, slug]
        });

        const roundData = roundRes.rows[0];
        if (!roundData) {
            return NextResponse.json({ error: 'Ronda no encontrada / Round not found' }, { status: 404 });
        }

        const maxPairs = roundData.max_pairs as number | null;
        const currentCount = roundData.current_count as number;

        /* 
        // Allow waitlist registration - removed blocking check
        if (maxPairs !== null && currentCount >= maxPairs) {
            return NextResponse.json({ error: 'Ronda llena / Round is full' }, { status: 400 });
        }
        */

        const result = await db.execute({
            sql: 'INSERT INTO players (player1, player2, round_slug) VALUES (?, ?, ?)',
            args: [player1, player2, slug || null], // Handle legacy global players as null slug
        });

        const id = result.lastInsertRowid?.toString();

        return NextResponse.json({ id, player1, player2, round_slug: slug }, { status: 201 });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to add players' }, { status: 500 });
    }
}
