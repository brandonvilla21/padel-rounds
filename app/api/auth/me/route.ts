import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('admin_session');

        if (!sessionCookie) {
            return NextResponse.json({ user: null });
        }

        let user;
        try {
            // Try parsing JSON format (new)
            user = JSON.parse(sessionCookie.value);
        } catch (e) {
            // Fallback for legacy simple string (if implementation allowed it, but we replaced it)
            // Or if existing cookies are present
            if (sessionCookie.value === 'true') {
                user = { id: 'root', role: 'root' };
            } else {
                // Invalid format
                return NextResponse.json({ user: null });
            }
        }

        return NextResponse.json({ user });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
}
