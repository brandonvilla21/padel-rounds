import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        await ensureSchema();
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        if (username.toLowerCase() === 'root') {
            return NextResponse.json({ error: 'Username "root" is reserved' }, { status: 400 });
        }

        // Check availability
        const existing = await db.execute({
            sql: 'SELECT id FROM users WHERE username = ?',
            args: [username]
        });

        if (existing.rows.length > 0) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute({
            sql: 'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            args: [username, hashedPassword, 'subadmin']
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
