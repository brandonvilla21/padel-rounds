'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import html2canvas from 'html2canvas';

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
                <h1 style={{ margin: 0 }}>{roundName || 'Cola de Partidas'}</h1>
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
                    title="Copiar enlace de esta partida"
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
                    ¡Esta partida ha alcanzado su límite de jugadores!
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
    const [isSharing, setIsSharing] = useState(false);

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







    const handleShareScore = async () => {
        const element = document.getElementById('scoreboard-to-share');
        if (!element) return;

        setIsSharing(true);
        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#0f172a', // Match app background
                scale: 2, // Better quality
                logging: false,
                useCORS: true
            });

            // Use JPEG for better photo compatibility
            const image = canvas.toDataURL("image/jpeg", 0.9);
            const fileName = `padel-score-${Date.now()}.jpg`;

            // Convert data URL to Blob
            const res = await fetch(image);
            const blob = await res.blob();
            const file = new File([blob], fileName, { type: "image/jpeg" });

            const shareData = {
                files: [file],
                title: 'Resultados',
                text: '¡Mira los resultados de nuestra partida!'
            };

            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                // Fallback: Download
                // Inform user if Web Share API is unavailable (e.g., non-HTTPS)
                alert('La función de compartir nativa no está disponible (requiere HTTPS). Se descargará la imagen en su lugar.');
                const link = document.createElement('a');
                link.href = image;
                link.download = fileName;
                link.click();
            }
        } catch (err) {
            console.error('Error sharing score:', err);
            alert('No se pudo compartir la imagen. Intenta de nuevo.');
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Tabla de Posiciones</h2>
                <button
                    onClick={handleShareScore}
                    disabled={isSharing}
                    style={{
                        background: 'var(--color-primary)',
                        color: 'black',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    {isSharing ? 'Generando...' : '📸 Compartir'}
                </button>
            </div>

            <div id="scoreboard-to-share" style={{ padding: '20px', backgroundColor: '#0f172a', borderRadius: '10px' }}>
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <h3 style={{ color: 'var(--color-primary)', margin: 0 }}>Resultados 🎾</h3>
                </div>
                <RankingTable matches={matches} />
            </div>

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
                                    <th>Cancha</th>
                                    <th>Pareja A</th>
                                    <th>Pareja B</th>
                                    <th>Resultado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matchesByRound[roundNum].map((m: any) => (
                                    <tr key={m.id}>
                                        <td style={{ fontWeight: 'bold', color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
                                            {m.court || '-'}
                                        </td>
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
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            onFocus={(e) => e.target.select()}
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
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            onFocus={(e) => e.target.select()}
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

    const sortedRankings = Object.values(rankings).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.wins - a.wins;
    });

    let currentRank = 1;

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
                    {sortedRankings.map((r, index) => {
                        // Calculate rank logic
                        if (index > 0) {
                            const prev = sortedRankings[index - 1];
                            if (r.points !== prev.points || r.wins !== prev.wins) {
                                currentRank = index + 1;
                            }
                        } else {
                            currentRank = 1;
                        }

                        // Determine color based on rank (Gold, Silver, Bronze)
                        let rankColor = 'inherit';
                        if (currentRank === 1) rankColor = '#fbbf24';
                        else if (currentRank === 2) rankColor = '#94a3b8';
                        else if (currentRank === 3) rankColor = '#b45309';

                        return (
                            <tr key={index}>
                                <td style={{ fontSize: '1.2rem', fontWeight: 'bold', color: rankColor }}>
                                    {currentRank}
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
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
