import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';

export async function GET() {
    try {
        await ensureSchema();
        const result = await db.execute('SELECT * FROM rounds ORDER BY created_at DESC');
        return NextResponse.json(result.rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch rounds' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await ensureSchema();
        const body = await request.json();
        const { name, slug, max_pairs } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: 'Name and Slug are required' }, { status: 400 });
        }

        const result = await db.execute({
            sql: 'INSERT INTO rounds (name, slug, max_pairs) VALUES (?, ?, ?)',
            args: [name, slug, max_pairs || null],
        });

        return NextResponse.json({
            id: result.lastInsertRowid?.toString(),
            name,
            slug,
            max_pairs
        }, { status: 201 });
    } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint failed')) {
            return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create round' }, { status: 500 });
    }
}
