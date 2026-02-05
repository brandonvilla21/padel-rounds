import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    // Await params as per Next.js 15+ changes
    const { slug } = await params;

    try {
        // Use a transaction if possible, or sequential deletes
        // Delete matches first
        await db.execute({
            sql: 'DELETE FROM matches WHERE round_slug = ?',
            args: [slug],
        });

        // Delete players next
        await db.execute({
            sql: 'DELETE FROM players WHERE round_slug = ?',
            args: [slug],
        });

        return NextResponse.json({ success: true, message: `Cleared players for round ${slug}` });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to clear round' }, { status: 500 });
    }
}
