import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { db, ensureSchema } from '@/lib/db';

export async function GET(request: Request) {
    try {
        await ensureSchema();
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

        let query = `
            SELECT r.*, u.username as creator_name 
            FROM rounds r 
            LEFT JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        `;
        let args: any[] = [];

        if (user.role !== 'root') {
            query = 'SELECT * FROM rounds WHERE user_id = ? ORDER BY created_at DESC';
            args = [user.id];
        }

        const result = await db.execute({
            sql: query,
            args
        });

        return NextResponse.json(result.rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch rounds' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    let user: any = null;
    let name, slug, max_pairs;

    try {
        await ensureSchema();

        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');

        if (session) {
            try {
                const parsed = JSON.parse(session.value);
                if (parsed === true) {
                    user = { id: 'root', role: 'root' };
                } else {
                    user = parsed;
                }
            } catch (e) {
                if (session.value === 'true') user = { id: 'root', role: 'root' };
            }
        }

        if (!user) {
            return NextResponse.json({ error: 'Must be logged in to create rounds' }, { status: 401 });
        }

        const body = await request.json();
        ({ name, slug, max_pairs } = body);

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        if (!slug) {
            slug = randomUUID();
        }

        // Handle user_id (root might not have an ID, or we use a special one, or NULL for root-owned?)
        // If query uses user_id=?, NULL won't match. 
        // Logic: If root creates it, maybe assign to NULL or a specific ID?
        // Let's assume root creates "system" rounds (user_id = NULL) or we treat root as just another user if we had a user entry.
        // But "root" is virtual.
        // Ideally, if user.role === 'root', user_id = NULL. 
        // Then GET for root returns ALL.
        // GET for subadmin returns user_id = ?.

        // Enforce Round Limit for Subadmins
        if (user.role !== 'root') {
            const countRes = await db.execute({
                sql: 'SELECT COUNT(*) as count FROM rounds WHERE user_id = ?',
                args: [user.id]
            });

            const currentCount = countRes.rows[0].count as number;

            if (currentCount >= 10) {
                return NextResponse.json({
                    error: 'Has alcanzado el límite de 10 rondas. Elimina una ronda antigua para crear una nueva.'
                }, { status: 403 });
            }
        }

        const userIdToInsert = user.role === 'root' ? null : (user.id || null);
        const maxPairsToInsert = max_pairs || null;

        const args = [name, slug, maxPairsToInsert, userIdToInsert];
        console.log('Inserting round with args:', args);

        const result = await db.execute({
            sql: 'INSERT INTO rounds (name, slug, max_pairs, user_id) VALUES (?, ?, ?, ?)',
            args: args,
        });

        return NextResponse.json({
            id: result.lastInsertRowid?.toString(),
            name,
            slug,
            max_pairs
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating round:', error);
        if (error.message?.includes('UNIQUE constraint failed')) {
            return NextResponse.json({ error: 'Este nombre/URL ya existe' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create round' }, { status: 500 });
    }
}
