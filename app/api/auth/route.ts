import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, ensureSchema } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        let sessionPayload = null;

        // Legacy Root Login (or just "root" user simulation)
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!username && password === adminPassword) {
            sessionPayload = { id: 'root', role: 'root' };
        }
        // Subadmin Login
        else if (username && password) {
            // For subadmin login, we might want to allow "root" as username if they prefer explicit login?
            // But for now, let's keep the legacy "just password" for root separately or handle "root" username.
            // Actually, plan said: "Verify credentials against users table OR env ADMIN_PASSWORD".

            await ensureSchema();
            const result = await db.execute({
                sql: 'SELECT * FROM users WHERE username = ?',
                args: [username]
            });

            const user = result.rows[0];
            if (user && await bcrypt.compare(password, user.password_hash as string)) {
                sessionPayload = { id: user.id, role: user.role };
            }
        }

        if (sessionPayload) {
            // Set a cookie (httpOnly, secure)
            const cookieStore = await cookies();
            cookieStore.set('admin_session', JSON.stringify(sessionPayload), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24, // 1 day
                path: '/',
            });
            return NextResponse.json({ success: true, user: sessionPayload });
        }

        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
    }
}
