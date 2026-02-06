import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

        // Auth Check
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');
        let user = null;
        if (session) {
            try {
                user = JSON.parse(session.value);
            } catch (e) {
                if (session.value === 'true') user = { id: 'root', role: 'root' };
            }
        }

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check Match -> Round Ownership
        // We need to join matches and rounds to check owner
        const matchRes = await db.execute({
            sql: `
                SELECT r.user_id 
                FROM matches m 
                JOIN rounds r ON m.round_slug = r.slug 
                WHERE m.id = ?
            `,
            args: [id]
        });

        if (matchRes.rows.length === 0) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        const round = matchRes.rows[0];
        if (user.role !== 'root') {
            if (round.user_id !== user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

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
