import { db, ensureSchema } from '@/lib/db';
import PadelBoard from '../components/PadelBoard';
import Link from 'next/link';

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

    return <PadelBoard slug={slug} roundName={round.name as string} />;
}
