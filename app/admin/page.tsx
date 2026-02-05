'use client';

import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminDashboard() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Dashboard state
    const [newRoundName, setNewRoundName] = useState('');
    const [newRoundSlug, setNewRoundSlug] = useState('');
    const [newMaxPairs, setNewMaxPairs] = useState(''); // Empty string for no limit
    const [createMsg, setCreateMsg] = useState('');

    const { data: rounds, mutate } = useSWR(isAuthenticated ? '/api/rounds' : null, fetcher);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/auth', {
            method: 'POST',
            body: JSON.stringify({ password }),
        });
        if (res.ok) {
            setIsAuthenticated(true);
        } else {
            alert('Contraseña Incorrecta');
        }
    };

    const createRound = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoundSlug || !newRoundName) return;

        const res = await fetch('/api/rounds', {
            method: 'POST',
            body: JSON.stringify({
                name: newRoundName,
                slug: newRoundSlug,
                max_pairs: newMaxPairs ? parseInt(newMaxPairs) : null
            }),
        });

        if (res.ok) {
            setNewRoundName('');
            setNewRoundSlug('');
            setNewMaxPairs('');
            setCreateMsg('Ronda Creada!');
            mutate();
            setTimeout(() => setCreateMsg(''), 3000);
        } else {
            const data = await res.json();
            setCreateMsg(data.error);
        }
    };

    const clearRound = async (slug: string) => {
        if (!confirm(`¿Estás seguro de que quieres BORRAR todos los jugadores de ${slug}?`)) return;

        const res = await fetch(`/api/rounds/${slug}/clear`, { method: 'POST' });
        if (res.ok) {
            alert('Ronda limpiada');
            mutate();
        } else {
            alert('Error al limpiar');
        }
    };

    const deleteRound = async (slug: string) => {
        if (!confirm(`PELIGRO: ¿Estás seguro de eliminar "${slug}"? Esto no se puede deshacer.`)) return;

        const res = await fetch(`/api/rounds/${slug}`, { method: 'DELETE' });
        if (res.ok) {
            mutate(); // Refresh list
        } else {
            alert('Error al eliminar ronda');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="app-container">
                <h1>Acceso Admin</h1>
                <form onSubmit={handleLogin} className="player-form" style={{ gridTemplateColumns: '1fr auto' }}>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Contraseña de Admin"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="submit-btn" style={{ padding: '0 20px' }}>Entrar</button>
                </form>
            </div>
        );
    }

    return (
        <div className="app-container" style={{ maxWidth: '1000px' }}>
            <h1>Panel de Control</h1>

            {/* Create Round */}
            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ marginBottom: '20px', fontSize: '1.2rem', color: 'var(--color-primary)' }}>Crear Nueva Ronda</h2>
                <form onSubmit={createRound} className="player-form">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Nombre de Ronda (ej. Cancha 1)"
                            value={newRoundName}
                            onChange={(e) => setNewRoundName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Slug Único (ej. cancha-1)"
                            value={newRoundSlug}
                            onChange={(e) => setNewRoundSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                            pattern="^[a-z0-9-]+$"
                            title="Solo letras minúsculas, números y guiones"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="number"
                            placeholder="Límite de parejas (Opcional)"
                            value={newMaxPairs}
                            onChange={(e) => setNewMaxPairs(e.target.value)}
                            min="1"
                        />
                    </div>
                    <button type="submit" className="submit-btn">Crear</button>
                </form>
                {createMsg && <p style={{ color: 'var(--color-accent)' }}>{createMsg}</p>}
            </section>

            {/* List Rounds */}
            <section>
                <h2 style={{ marginBottom: '20px', fontSize: '1.2rem', color: 'var(--color-primary)' }}>Rondas Activas</h2>
                <div className="table-wrapper">
                    <table className="players-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Enlace</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!rounds ? (
                                <tr><td colSpan={3}>Cargando...</td></tr>
                            ) : rounds.map((r: any) => (
                                <tr key={r.id}>
                                    <td>{r.name}</td>
                                    <td>
                                        <a href={`/${r.slug}`} target="_blank" style={{ color: 'var(--color-primary)' }}>
                                            /{r.slug}
                                        </a>
                                    </td>
                                    <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => clearRound(r.slug)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#fca5a5',
                                                border: '1px solid #fca5a5',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Limpiar
                                        </button>
                                        <button
                                            onClick={() => deleteRound(r.slug)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.4)',
                                                color: '#fff',
                                                border: '1px solid #ef4444',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 600
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                        <RoundMatches slug={r.slug} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function RoundMatches({ slug }: { slug: string }) {
    const { data: matches, mutate } = useSWR(`/api/rounds/${slug}/matches`, fetcher);

    const generateMatches = async () => {
        if (!confirm('Generar partidos bloqueará la lista. ¿Continuar?')) return;
        const res = await fetch(`/api/rounds/${slug}/matches`, { method: 'POST' });
        if (res.ok) mutate();
        else alert('Error generating matches');
    };

    const updateScore = async (id: number, score1: number, score2: number) => {
        const res = await fetch(`/api/matches/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ score1, score2 })
        });
        if (res.ok) mutate();
    };

    if (!matches || matches.error) {
        // Potentially not enough players or error
        return (
            <button
                onClick={generateMatches}
                style={{
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                }}
            >
                Generar Partidos
            </button>
        );
    }

    if (matches.length === 0) {
        return (
            <button
                onClick={generateMatches}
                style={{
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                }}
            >
                Generar Partidos
            </button>
        );
    }

    // Group matches by round
    const matchesByRound = matches && !matches.error ? matches.reduce((acc: any, m: any) => {
        const r = m.match_round || 1;
        if (!acc[r]) acc[r] = [];
        acc[r].push(m);
        return acc;
    }, {}) : {};

    return (
        <div style={{ width: '100%', marginTop: '10px', minWidth: '300px' }}>
            <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>Partidos:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {Object.keys(matchesByRound).sort((a, b) => Number(a) - Number(b)).map((roundNum) => (
                    <div key={roundNum}>
                        <div style={{
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            color: 'var(--color-primary)',
                            marginBottom: '5px',
                            borderBottom: '1px solid var(--color-surface-hover)',
                            paddingBottom: '2px'
                        }}>
                            Ronda {roundNum}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {matchesByRound[roundNum].map((m: any) => (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--color-text-dim)', flex: 1 }}>{m.p1_p1}/{m.p1_p2} vs {m.p2_p1}/{m.p2_p2}</span>
                                    <input
                                        type="number"
                                        value={m.score1}
                                        onChange={(e) => updateScore(m.id, parseInt(e.target.value) || 0, m.score2)}
                                        style={{ width: '40px', padding: '2px', background: '#334155', border: 'none', color: 'white', borderRadius: '4px' }}
                                    />
                                    <span>-</span>
                                    <input
                                        type="number"
                                        value={m.score2}
                                        onChange={(e) => updateScore(m.id, m.score1, parseInt(e.target.value) || 0)}
                                        style={{ width: '40px', padding: '2px', background: '#334155', border: 'none', color: 'white', borderRadius: '4px' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
