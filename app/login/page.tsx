'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const res = await fetch('/api/auth', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        if (res.ok) {
            router.push('/admin');
            router.refresh(); // Refresh to update server components/SWR
        } else {
            const data = await res.json();
            setError(data.error || 'Login fallido');
        }
    };

    return (
        <div className="app-container" style={{ maxWidth: '400px', marginTop: '50px' }}>
            <h1>Iniciar Sesión</h1>
            <form onSubmit={handleLogin} className="player-form" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--color-text-dim)' }}>Usuario</label>
                    <input
                        type="text"
                        placeholder="Usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }}
                    />
                </div>
                <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--color-text-dim)' }}>Contraseña</label>
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }}
                        required
                    />
                </div>
                <button type="submit" className="submit-btn" style={{ width: '100%', marginTop: '10px' }}>Entrar</button>
            </form>
            {error && <p style={{ color: '#ef4444', marginTop: '15px', textAlign: 'center' }}>{error}</p>}

            <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #334155', paddingTop: '20px' }}>
                <p style={{ color: 'var(--color-text-dim)', marginBottom: '10px' }}>¿No tienes cuenta?</p>
                <Link href="/register" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                    Registrarse como Admin
                </Link>
            </div>
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <Link href="/" style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
                    ← Volver al Inicio
                </Link>
            </div>
        </div>
    );
}
