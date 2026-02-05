'use client';

import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Player {
    id: number;
    player1: string;
    player2: string;
}

export default function PadelBoard() {
    const [player1, setPlayer1] = useState('');
    const [player2, setPlayer2] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Poll every 1000ms (1 second) to ensure near real-time updates for all users
    const { data: players, error, mutate } = useSWR<Player[]>('/api/players', fetcher, {
        refreshInterval: 1000,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!player1.trim() || !player2.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/players', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player1, player2 }),
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
            <h1>Padel Rounds Queue</h1>

            <form className="player-form" onSubmit={handleSubmit}>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Player 1 Name"
                        value={player1}
                        onChange={(e) => setPlayer1(e.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                </div>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Player 2 Name"
                        value={player2}
                        onChange={(e) => setPlayer2(e.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                </div>
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Join Queue'}
                </button>
            </form>

            <div className="table-wrapper">
                <table className="players-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Player 1</th>
                            <th>Player 2</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!players ? (
                            <tr>
                                <td colSpan={3} className="empty-state">Loading court data...</td>
                            </tr>
                        ) : players.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="empty-state">No players in queue. Be the first!</td>
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
