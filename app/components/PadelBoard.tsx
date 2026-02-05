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
}

export default function PadelBoard({ slug, roundName, maxPairs }: PadelBoardProps) {
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

    return (
        <div className="app-container">
            <h1>{roundName || 'Cola de Padel Rounds'}</h1>

            {maxPairs && (
                <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                    Capacidad: {players?.length || 0} / {maxPairs}
                </div>
            )}

            <form className="player-form" onSubmit={handleSubmit} style={{ opacity: isFull ? 0.5 : 1, pointerEvents: isFull ? 'none' : 'auto' }}>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Nombre Jugador 1"
                        value={player1}
                        onChange={(e) => setPlayer1(e.target.value)}
                        disabled={isSubmitting || isFull}
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
                    {isFull ? 'Ronda Llena' : isSubmitting ? 'Agregando...' : 'Unirse a la Lista'}
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
                        </tr>
                    </thead>
                    <tbody>
                        {!players ? (
                            <tr>
                                <td colSpan={3} className="empty-state">Cargando datos...</td>
                            </tr>
                        ) : players.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="empty-state">No hay jugadores en lista. ¡Sé el primero!</td>
                            </tr>
                        ) : (
                            players.map((match, index) => (
                                <tr key={match.id}>
                                    <td className="rank-cell">{index + 1}</td>
                                    <td>{match.player1}</td>
                                    <td>{match.player2}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <MatchesSection slug={slug} />
        </div>
    );
}

function MatchesSection({ slug }: { slug?: string }) {
    // Only fetch if slug exists
    const { data: matches } = useSWR(slug ? `/api/rounds/${slug}/matches` : null, fetcher, { refreshInterval: 5000 });

    if (!matches || matches.error || matches.length === 0) return null;

    // Group matches by round
    const matchesByRound = matches.reduce((acc: any, m: any) => {
        const r = m.match_round || 1;
        if (!acc[r]) acc[r] = [];
        acc[r].push(m);
        return acc;
    }, {});

    return (
        <div style={{ marginTop: '40px' }}>
            <h2>Tabla de Posiciones</h2>
            <RankingTable matches={matches} />

            <h2 style={{ marginTop: '40px' }}>Partidos (Americano)</h2>

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
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                {m.score1} - {m.score2}
                                            </div>
                                            {m.played ?
                                                <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Finalizado</span> :
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Pendiente</span>
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
