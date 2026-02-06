'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminDashboard() {
    const router = useRouter();
    const { data: userData, error: userError } = useSWR('/api/auth/me', fetcher);
    const isAuthenticated = userData && userData.user;

    // Dashboard state
    const [newRoundName, setNewRoundName] = useState('');
    const [newRoundSlug, setNewRoundSlug] = useState('');
    const [newMaxPairs, setNewMaxPairs] = useState(''); // Empty string for no limit
    const [createMsg, setCreateMsg] = useState('');

    const { data: rounds, mutate } = useSWR(isAuthenticated ? '/api/rounds' : null, fetcher);

    useEffect(() => {
        // If loaded and not authenticated, redirect to login
        if (userData && !userData.user) {
            router.push('/login');
        }
    }, [userData, router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        mutate(); // clear data
        window.location.href = '/login'; // Force full reload to verify session clear if needed, or router.push
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

    if (!userData) return <div className="app-container">Cargando...</div>;
    if (!isAuthenticated) return null;

    const user = userData.user;

    return (
        <div className="app-container" style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0 }}>Panel de Control</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ color: 'var(--color-primary)' }}>
                        {user.role === 'root' ? '👑 Root Admin' : `👤 ${user.role === 'subadmin' ? 'Admin' : user.role} (ID: ${user.id})`}
                    </span>
                    <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #334155', color: '#cbd5e1', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                        Salir
                    </button>
                </div>
            </div>

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
                            placeholder="URL Único (ej. cancha-1)"
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
                    <button type="submit" className="submit-btn" style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-primary)' }}>Crear</button>
                </form>
                {createMsg && <p style={{ color: 'var(--color-accent)' }}>{createMsg}</p>}
            </section>

            {/* List Rounds */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--color-primary)', margin: 0 }}>
                        {user.role === 'root' ? 'Todas las Rondas' : 'Tus Rondas Activas'}
                    </h2>
                </div>

                <div className="table-wrapper">
                    <table className="players-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                {user.role === 'root' && <th>Creador</th>}
                                <th>Enlace</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!rounds ? (
                                <tr><td colSpan={user.role === 'root' ? 4 : 3}>Cargando...</td></tr>
                            ) : rounds.length === 0 ? (
                                <tr><td colSpan={user.role === 'root' ? 4 : 3} style={{ textAlign: 'center', color: 'var(--color-text-dim)' }}>No hay rondas.</td></tr>
                            ) : rounds.map((r: any) => (
                                <tr key={r.id}>
                                    <td>{r.name}</td>
                                    {user.role === 'root' && (
                                        <td>
                                            {r.creator_name ? (
                                                <span style={{ color: '#fbbf24' }}>{r.creator_name}</span>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Root/System</span>
                                            )}
                                        </td>
                                    )}
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
                                        <a href={`/${r.slug}`} target="_blank" style={{
                                            background: 'var(--color-surface)', border: '1px solid var(--color-surface-hover)',
                                            padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', color: 'white', fontSize: '0.9rem'
                                        }}>
                                            Ver
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Root Admin: List Users */}
            {user.role === 'root' && (
                <>
                    <UsersList />
                    <MaintenanceSection />
                </>
            )}
        </div>
    );
}

function UsersList() {
    const { data: users, mutate } = useSWR('/api/users', fetcher);

    if (!users) return null;

    const deleteUser = async (id: number, username: string) => {
        if (!confirm(`PELIGRO CRÍTICO: ¿Estás seguro de eliminar al usuario "${username}"?\n\nESTO ELIMINARÁ TODAS LAS RONDAS, JUGADORES Y PARTIDOS CREADOS POR ESTE USUARIO.\n\nEsta acción no se puede deshacer.`)) return;

        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                mutate();
                alert('Usuario eliminado correctamente.');
            } else {
                const data = await res.json();
                alert(data.error || 'Error al eliminar usuario');
            }
        } catch (err) {
            alert('Error de conexión');
        }
    };

    return (
        <section style={{ marginTop: '50px', borderTop: '1px solid #334155', paddingTop: '30px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.2rem', color: 'var(--color-primary)' }}>Subadmins Registrados</h2>
            <div className="table-wrapper">
                <table className="players-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Fecha Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr><td colSpan={5}>No hay usuarios registrados.</td></tr>
                        ) : users.map((u: any) => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td style={{ fontWeight: 'bold' }}>{u.username}</td>
                                <td>{u.role === 'subadmin' ? 'Admin' : u.role}</td>
                                <td style={{ color: 'var(--color-text-dim)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                <td>
                                    {u.role !== 'root' && (
                                        <button
                                            onClick={() => deleteUser(u.id, u.username)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.4)',
                                                color: '#fff',
                                                border: '1px solid #ef4444',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function MaintenanceSection() {
    const handleCleanup = async () => {
        if (!confirm('¿Ejecutar limpieza de base de datos? Esto eliminará jugadores huérfanos (que no pertenecen a ninguna ronda existente).')) return;

        try {
            const res = await fetch('/api/admin/cleanup', { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert('Error al ejecutar limpieza');
        }
    };

    return (
        <section style={{ marginTop: '50px', borderTop: '1px solid #334155', paddingTop: '30px', marginBottom: '50px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.2rem', color: '#fca5a5' }}>Mantenimiento del Sistema</h2>
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                <p style={{ marginBottom: '15px', color: 'var(--color-text-dim)' }}>
                    Utilidad para eliminar datos basura (jugadores sin ronda asignada) que pueden haber quedado de versiones anteriores.
                </p>
                <button
                    onClick={handleCleanup}
                    style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    🧹 Limpiar Jugadores Huérfanos
                </button>
            </div>
        </section>
    );
}
