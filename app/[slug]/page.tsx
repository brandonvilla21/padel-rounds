import { db, ensureSchema } from '@/lib/db';
import PadelBoard from '../components/PadelBoard';
import Link from 'next/link';
import { cookies } from 'next/headers';

export default async function RoundPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    await ensureSchema();
    const result = await db.execute({
        sql: 'SELECT * FROM rounds WHERE slug = ?',
        args: [slug]
    });

    const round = result.rows[0];

    if (!round) {
        return (
            <div className="app-container" style={{ textAlign: 'center' }}>
                <h1 style={{ color: '#ef4444' }}>Ronda No Encontrada</h1>
                <p style={{ marginBottom: '2rem', color: 'var(--color-text-dim)' }}>
                    La ronda <strong>{slug}</strong> no está activa o no existe.
                </p>
                <Link href="/" className="submit-btn" style={{ textDecoration: 'none', background: 'var(--color-surface-hover)' }}>
                    Ir al Inicio
                </Link>
            </div>
        );
    }

    // Check ownership
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    let isOwner = false;

    if (session) {
        try {
            const user = JSON.parse(session.value);
            if (user.role === 'root') {
                isOwner = true;
            } else if (round.user_id === user.id) {
                isOwner = true;
            }
        } catch (e) {
            // Legacy cookie check
            if (session.value === 'true') isOwner = true;
        }
    }

    return <PadelBoard
        slug={slug}
        roundName={round.name as string}
        maxPairs={round.max_pairs as number | null}
        isOwner={isOwner}
    />;
}
