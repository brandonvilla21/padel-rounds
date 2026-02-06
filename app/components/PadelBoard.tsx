'use client';

import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Player {
    id: number;
    player1: string;
    player2: string;
}

interface PadelBoardProps {
    slug?: string;
    roundName?: string;
    maxPairs?: number | null;
    isOwner?: boolean;
}

export default function PadelBoard({ slug, roundName, maxPairs, isOwner }: PadelBoardProps) {
    const [player1, setPlayer1] = useState('');
    const [player2, setPlayer2] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Poll every 1000ms (1 second) to ensure near real-time updates for all users
    const { data: players, error, mutate } = useSWR<Player[]>(
        `/api/players${slug ? `?slug=${slug}` : ''}`,
        fetcher,
        { refreshInterval: 1000 }
    );

    const isFull = !!(maxPairs && players && players.length >= maxPairs);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');
        if (!player1.trim() || !player2.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/players', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player1, player2, slug }),
            });

            if (res.ok) {
                setPlayer1('');
                setPlayer2('');
                mutate(); // Trigger immediate re-fetch
            } else {
                const data = await res.json();
                setSubmitError(data.error || 'Error al agregar');
            }
        } catch (err) {
            console.error('Failed to submit players', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const [copySuccess, setCopySuccess] = useState(false);

    const handleDeletePlayer = async (id: number) => {
        if (!confirm('¿Eliminar esta pareja?')) return;
        try {
            const res = await fetch(`/api/players/${id}`, { method: 'DELETE' });
            if (res.ok) {
                mutate();
            } else {
                const data = await res.json();
                alert(data.error || 'Error al eliminar');
            }
        } catch (err) {
            alert('Error de conexión');
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy!', err);
        }
    };

    return (
        <div className="app-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0 }}>{roundName || 'Cola de Padel Rounds'}</h1>
                <button
                    onClick={handleCopyLink}
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--color-primary)',
                        color: 'var(--color-primary)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease'
                    }}
                    title="Copiar enlace de esta ronda"
                >
                    <span>🔗</span>
                    {copySuccess ? '¡Enlace Copiado!' : 'Copiar enlace'}
                </button>
            </div>

            {maxPairs && (
                <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                    Capacidad: {players ? Math.min(players.length, maxPairs) : 0} / {maxPairs}
                    {players && players.length > maxPairs && (
                        <span style={{ marginLeft: '10px', color: '#fca5a5' }}>
                            (+{players.length - maxPairs} en espera)
                        </span>
                    )}
                </div>
            )}

            <form className="player-form" onSubmit={handleSubmit} style={{ opacity: 1, pointerEvents: 'auto' }}>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Nombre Jugador 1"
                        value={player1}
                        onChange={(e) => setPlayer1(e.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                </div>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Nombre Jugador 2"
                        value={player2}
                        onChange={(e) => setPlayer2(e.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                </div>
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Agregando...' : isFull ? 'Unirse a Lista de Espera' : 'Unirse a la Lista'}
                </button>
            </form>

            {submitError && (
                <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '20px' }}>{submitError}</p>
            )}

            {isFull && (
                <p style={{ color: 'var(--color-accent)', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>
                    ¡Esta ronda ha alcanzado su límite de jugadores!
                </p>
            )}

            <div className="table-wrapper">
                <table className="players-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Jugador 1</th>
                            <th>Jugador 2</th>
                            {isOwner && <th style={{ width: '50px' }}></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {!players ? (
                            <tr>
                                <td colSpan={isOwner ? 4 : 3} className="empty-state">Cargando datos...</td>
                            </tr>
                        ) : players.length === 0 ? (
                            <tr>
                                <td colSpan={isOwner ? 4 : 3} className="empty-state">No hay jugadores en lista. ¡Sé el primero!</td>
                            </tr>
                        ) : (
                            players.slice(0, maxPairs || players.length).map((match, index) => (
                                <tr key={match.id}>
                                    <td className="rank-cell">{index + 1}</td>
                                    <td>{match.player1}</td>
                                    <td>{match.player2}</td>
                                    {isOwner && (
                                        <td style={{ width: '50px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDeletePlayer(match.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#ef4444',
                                                    fontSize: '1.1rem',
                                                    padding: '4px',
                                                    borderRadius: '4px'
                                                }}
                                                title="Eliminar pareja"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Waiting List Section */}
            {players && maxPairs && players.length > maxPairs && (
                <div style={{ marginTop: '30px' }}>
                    <h3 style={{ color: '#fca5a5', marginBottom: '15px' }}>Lista de Espera ⏳</h3>
                    <div className="table-wrapper" style={{ border: '1px solid rgba(252, 165, 165, 0.2)' }}>
                        <table className="players-table">
                            <thead>
                                <tr>
                                    <th>Orden</th>
                                    <th>Pareja en Espera</th>
                                    {isOwner && <th style={{ width: '50px' }}></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {players.slice(maxPairs).map((match, index) => (
                                    <tr key={match.id} style={{ background: 'rgba(252, 165, 165, 0.05)' }}>
                                        <td style={{ color: '#fca5a5', fontWeight: 'bold' }}>{index + 1}</td>
                                        <td>
                                            <div>{match.player1}</div>
                                            <div style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}>{match.player2}</div>
                                        </td>
                                        {isOwner && (
                                            <td style={{ width: '50px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => handleDeletePlayer(match.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: '#ef4444',
                                                        fontSize: '1.1rem',
                                                        padding: '4px',
                                                        borderRadius: '4px'
                                                    }}
                                                    title="Eliminar de espera"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--color-text-dim)', textAlign: 'center' }}>
                        Si una pareja de la lista principal abandona, la primera pareja en espera entrará automáticamente.
                    </p>
                </div>
            )}

            <MatchesSection slug={slug} isOwner={isOwner} />
        </div>
    );
}

function MatchesSection({ slug, isOwner }: { slug?: string, isOwner?: boolean }) {
    // Only fetch if slug exists
    const { data: matches, mutate } = useSWR(slug ? `/api/rounds/${slug}/matches` : null, fetcher, { refreshInterval: 5000 });

    const generateMatches = async () => {
        if (!confirm('¿Generar partidos? Esto cerrará la lista de jugadores.')) return;
        try {
            const res = await fetch(`/api/rounds/${slug}/matches`, { method: 'POST' });
            if (res.ok) {
                mutate();
            } else {
                const data = await res.json();
                alert(data.error || 'Error al generar partidos');
            }
        } catch (err) {
            alert('Error de conexión');
        }
    };

    const updateScore = async (id: number, score1: number, score2: number) => {
        const res = await fetch(`/api/matches/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score1, score2 })
        });
        if (res.ok) mutate();
    };

    if (!matches || matches.error) return null;

    if (matches.length === 0) {
        if (!isOwner) {
            return (
                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '20px' }}>Partidos</h2>
                    <p style={{ marginBottom: '20px', color: 'var(--color-text-dim)' }}>
                        Esperando que el organizador genere los partidos...
                    </p>
                </div>
            );
        }

        return (
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '20px' }}>Partidos</h2>
                <p style={{ marginBottom: '20px', color: 'var(--color-text-dim)' }}>
                    Aún no se han generado los partidos para esta ronda.
                </p>
                <button
                    onClick={generateMatches}
                    className="submit-btn"
                    style={{ maxWidth: '200px', margin: '0 auto' }}
                >
                    Generar Partidos
                </button>
            </div>
        );
    }

    // Group matches by round
    const matchesByRound = matches.reduce((acc: any, m: any) => {
        const r = m.match_round || 1;
        if (!acc[r]) acc[r] = [];
        acc[r].push(m);
        return acc;
    }, {});

    // Calculate total score for each round to validate they are equal
    const roundScores: Record<string, number> = {};
    Object.keys(matchesByRound).forEach(r => {
        roundScores[r] = matchesByRound[r].reduce((sum: number, m: any) => sum + (m.score1 || 0) + (m.score2 || 0), 0);
    });

    const uniqueScores = Array.from(new Set(Object.values(roundScores)));

    // Enhanced Validation Logic
    let showWarning = false;
    let warningMessage = '';

    if (uniqueScores.length > 1) {
        showWarning = true;
        const scores = Object.values(roundScores);
        const frequency: Record<number, number> = {};
        let maxFreq = 0;
        let modeScore = scores[0]; // Default to first if tied

        scores.forEach(s => {
            frequency[s] = (frequency[s] || 0) + 1;
            if (frequency[s] > maxFreq) {
                maxFreq = frequency[s];
                modeScore = s;
            }
        });

        const outlierRounds = Object.keys(roundScores).filter(r => roundScores[r] !== modeScore);

        warningMessage = `Atención: La suma de juegos no es igual en todas las rondas. Parece que el número de juegos habitual es ${modeScore}, pero revisa la(s) ronda(s): ${outlierRounds.join(', ')}.`;
    }

    return (
        <div style={{ marginTop: '40px' }}>
            <h2>Tabla de Posiciones</h2>
            <RankingTable matches={matches} />

            <h2 style={{ marginTop: '40px' }}>Partidos (Americano)</h2>

            {showWarning && (
                <div style={{
                    backgroundColor: '#fff7ed',
                    border: '1px solid #fed7aa',
                    color: '#c2410c',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>⚠️</span>
                    <strong>{warningMessage}</strong>
                </div>
            )}

            {Object.keys(matchesByRound).sort((a, b) => Number(a) - Number(b)).map((roundNum) => (
                <div key={roundNum} style={{ marginBottom: '30px' }}>
                    <h3 style={{
                        fontSize: '1.2rem',
                        color: 'var(--color-primary)',
                        marginBottom: '15px',
                        borderBottom: '1px solid var(--color-surface-hover)',
                        paddingBottom: '5px'
                    }}>
                        Ronda {roundNum}
                    </h3>
                    <div className="table-wrapper">
                        <table className="players-table">
                            <thead>
                                <tr>
                                    <th>Pareja A</th>
                                    <th>Pareja B</th>
                                    <th>Resultado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matchesByRound[roundNum].map((m: any) => (
                                    <tr key={m.id}>
                                        <td>
                                            <div style={{ fontWeight: 'bold' }}>{m.p1_p1}</div>
                                            <div style={{ color: 'var(--color-primary)' }}>{m.p1_p2}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 'bold' }}>{m.p2_p1}</div>
                                            <div style={{ color: 'var(--color-primary)' }}>{m.p2_p2}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {isOwner ? (
                                                    <>
                                                        <input
                                                            type="number"
                                                            value={m.score1}
                                                            onChange={(e) => updateScore(m.id, parseInt(e.target.value) || 0, m.score2)}
                                                            style={{
                                                                width: '50px',
                                                                padding: '6px',
                                                                background: 'rgba(255,255,255,0.05)',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                color: 'white',
                                                                borderRadius: '6px',
                                                                textAlign: 'center',
                                                                fontSize: '1.1rem',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                        <span style={{ fontWeight: 'bold', color: 'var(--color-text-dim)' }}>-</span>
                                                        <input
                                                            type="number"
                                                            value={m.score2}
                                                            onChange={(e) => updateScore(m.id, m.score1, parseInt(e.target.value) || 0)}
                                                            style={{
                                                                width: '50px',
                                                                padding: '6px',
                                                                background: 'rgba(255,255,255,0.05)',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                color: 'white',
                                                                borderRadius: '6px',
                                                                textAlign: 'center',
                                                                fontSize: '1.1rem',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                        {m.score1} - {m.score2}
                                                    </span>
                                                )}
                                            </div>
                                            {m.played ?
                                                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>Finalizado</div> :
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>Pendiente</div>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}

function RankingTable({ matches }: { matches: any[] }) {
    // Calculate rankings
    const rankings: Record<number, { p1: string, p2: string, points: number, matchesPlayed: number, wins: number, losses: number, draws: number }> = {};

    matches.forEach(m => {
        // Initialize scores for Pair 1
        if (!rankings[m.pair1_id]) {
            rankings[m.pair1_id] = { p1: m.p1_p1, p2: m.p1_p2, points: 0, matchesPlayed: 0, wins: 0, losses: 0, draws: 0 };
        }
        // Initialize scores for Pair 2
        if (!rankings[m.pair2_id]) {
            rankings[m.pair2_id] = { p1: m.p2_p1, p2: m.p2_p2, points: 0, matchesPlayed: 0, wins: 0, losses: 0, draws: 0 };
        }

        if (m.played) {
            rankings[m.pair1_id].points += m.score1;
            rankings[m.pair1_id].matchesPlayed += 1;

            rankings[m.pair2_id].points += m.score2;
            rankings[m.pair2_id].matchesPlayed += 1;

            if (m.score1 > m.score2) {
                rankings[m.pair1_id].wins += 1;
                rankings[m.pair2_id].losses += 1;
            } else if (m.score2 > m.score1) {
                rankings[m.pair2_id].wins += 1;
                rankings[m.pair1_id].losses += 1;
            } else {
                rankings[m.pair1_id].draws += 1;
                rankings[m.pair2_id].draws += 1;
            }
        }
    });

    const sortedRankings = Object.values(rankings).sort((a, b) => b.points - a.points);

    return (
        <div className="table-wrapper" style={{ marginBottom: '20px', background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <table className="players-table">
                <thead>
                    <tr>
                        <th style={{ width: '50px' }}>#</th>
                        <th>Pareja</th>
                        <th style={{ textAlign: 'center', width: '40px' }}>PJ</th>
                        <th style={{ textAlign: 'center', width: '40px' }} title="Ganados">G</th>
                        <th style={{ textAlign: 'center', width: '40px' }} title="Empatados">E</th>
                        <th style={{ textAlign: 'center', width: '40px' }} title="Perdidos">P</th>
                        <th style={{ textAlign: 'right', width: '80px' }}>Puntos</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedRankings.map((r, index) => (
                        <tr key={index}>
                            <td style={{ fontSize: '1.2rem', fontWeight: 'bold', color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'inherit' }}>
                                {index + 1}
                            </td>
                            <td>
                                <div style={{ fontWeight: 'bold' }}>{r.p1}</div>
                                <div style={{ color: 'var(--color-primary)' }}>{r.p2}</div>
                            </td>
                            <td style={{ textAlign: 'center', color: 'var(--color-text-dim)' }}>{r.matchesPlayed}</td>
                            <td style={{ textAlign: 'center' }}>{r.wins}</td>
                            <td style={{ textAlign: 'center' }}>{r.draws}</td>
                            <td style={{ textAlign: 'center' }}>{r.losses}</td>
                            <td style={{ textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold' }}>{r.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
