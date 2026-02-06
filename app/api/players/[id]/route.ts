import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, ensureSchema } from '@/lib/db';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let user = null;
        try {
            user = JSON.parse(session.value);
        } catch (e) {
            if (session.value === 'true') user = { id: 'root', role: 'root' };
        }

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await ensureSchema();

        // 1. Get player info to check round ownership
        const playerRes = await db.execute({
            sql: 'SELECT round_slug FROM players WHERE id = ?',
            args: [id]
        });

        if (playerRes.rows.length === 0) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }

        const roundSlug = playerRes.rows[0].round_slug as string;

        // 2. Check round ownership
        if (user.role !== 'root') {
            const roundRes = await db.execute({
                sql: 'SELECT user_id FROM rounds WHERE slug = ?',
                args: [roundSlug]
            });

            if (roundRes.rows.length === 0) {
                return NextResponse.json({ error: 'Round not found' }, { status: 404 });
            }

            const roundOwnerId = roundRes.rows[0].user_id as number;
            // user.id could be string or number, ensure comparison works
            if (String(roundOwnerId) !== String(user.id)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // 3. Check if player has matches (constraints)
        // If matches exist, we probably shouldn't delete the player as it would break match history
        const matchesRes = await db.execute({
            sql: 'SELECT id FROM matches WHERE pair1_id = ? OR pair2_id = ? LIMIT 1',
            args: [id, id]
        });

        if (matchesRes.rows.length > 0) {
            return NextResponse.json({ error: 'No se puede eliminar: Esta pareja ya tiene partidos generados. Limpia la ronda primero.' }, { status: 400 });
        }

        // 4. Delete the player
        await db.execute({
            sql: 'DELETE FROM players WHERE id = ?',
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete player error:', error);
        return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 });
    }
}
