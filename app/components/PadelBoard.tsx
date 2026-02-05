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
}

export default function PadelBoard({ slug, roundName }: PadelBoardProps) {
    const [player1, setPlayer1] = useState('');
    const [player2, setPlayer2] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Poll every 1000ms (1 second) to ensure near real-time updates for all users
    const { data: players, error, mutate } = useSWR<Player[]>(
        `/api/players${slug ? `?slug=${slug}` : ''}`,
        fetcher,
        { refreshInterval: 1000 }
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

            <form className="player-form" onSubmit={handleSubmit}>
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
                    {isSubmitting ? 'Agregando...' : 'Unirse a la Lista'}
                </button>
            </form>

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
        </div>
    );
}
