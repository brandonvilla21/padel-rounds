import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, ensureSchema } from '@/lib/db';

export async function DELETE() {
    try {
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

        if (!user || user.role !== 'root') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await ensureSchema();

        // Delete players where the round_slug does NOT exist in the rounds table
        // Also delete players with NULL slug if we decide they are invalid (which we do now)

        const result = await db.execute(`
            DELETE FROM players 
            WHERE round_slug IS NULL 
            OR round_slug NOT IN (SELECT slug FROM rounds)
        `);

        return NextResponse.json({
            success: true,
            message: `Limpieza completada. Filas eliminadas: ${result.rowsAffected}`
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ error: 'Failed to cleanup database' }, { status: 500 });
    }
}
