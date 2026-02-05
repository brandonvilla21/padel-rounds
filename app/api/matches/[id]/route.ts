import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();
        const { score1, score2 } = body;

        if (score1 === undefined || score2 === undefined) {
            return NextResponse.json({ error: 'Scores are required' }, { status: 400 });
        }

        await ensureSchema();

        await db.execute({
            sql: 'UPDATE matches SET score1 = ?, score2 = ?, played = 1 WHERE id = ?',
            args: [score1, score2, id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update match error:", error);
        return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
    }
}
