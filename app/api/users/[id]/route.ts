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

        // 1. Verify Root Admin
        let user = null;
        if (session) {
            try {
                user = JSON.parse(session.value);
            } catch (e) {
                if (session.value === 'true') user = { id: 'root', role: 'root' };
            }
        }

        if (!user || user.role !== 'root') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (id === 'root') {
            return NextResponse.json({ error: 'Cannot delete root admin' }, { status: 400 });
        }

        await ensureSchema();

        // 2. Delete all data associated with this user
        // We need to delete matches/players first which depend on rounds, then rounds, then user

        // Delete matches for rounds owned by this user
        await db.execute({
            sql: `DELETE FROM matches WHERE round_slug IN (SELECT slug FROM rounds WHERE user_id = ?)`,
            args: [id]
        });

        // Delete players for rounds owned by this user
        await db.execute({
            sql: `DELETE FROM players WHERE round_slug IN (SELECT slug FROM rounds WHERE user_id = ?)`,
            args: [id]
        });

        // Delete rounds owned by this user
        await db.execute({
            sql: `DELETE FROM rounds WHERE user_id = ?`,
            args: [id]
        });

        // 3. Delete the user
        await db.execute({
            sql: `DELETE FROM users WHERE id = ?`,
            args: [id]
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
