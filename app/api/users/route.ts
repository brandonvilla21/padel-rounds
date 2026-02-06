import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, ensureSchema } from '@/lib/db';

export async function GET() {
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
        const result = await db.execute('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');

        return NextResponse.json(result.rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
