import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        await ensureSchema();

        // Use a transaction if possible, or sequential deletes
        // Delete players first (Foreign Key might cascade but better to be explicit or if cascading is not set)
        await db.execute({
            sql: 'DELETE FROM players WHERE round_slug = ?',
            args: [slug],
        });

        // Delete the round
        await db.execute({
            sql: 'DELETE FROM rounds WHERE slug = ?',
            args: [slug],
        });

        return NextResponse.json({ success: true, message: `Deleted round ${slug}` });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: 'Failed to delete round' }, { status: 500 });
    }
}
