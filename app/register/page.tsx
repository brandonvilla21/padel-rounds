'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        if (res.ok) {
            setSuccess('Cuenta creada exitosamente. Redirigiendo...');
            setTimeout(() => {
                router.push('/login');
            }, 1500);
        } else {
            const data = await res.json();
            setError(data.error || 'Registro fallido');
        }
    };

    return (
        <div className="app-container" style={{ maxWidth: '400px', marginTop: '50px' }}>
            <h1>Registro de Admin</h1>
            <p style={{ color: 'var(--color-text-dim)', marginBottom: '20px' }}>
                Crea una cuenta para gestionar tus propias rondas de Padel.
            </p>
            <form onSubmit={handleRegister} className="player-form" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--color-text-dim)' }}>Usuario</label>
                    <input
                        type="text"
                        placeholder="Elige un nombre de usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }}
                        pattern="^[a-zA-Z0-9_\-]+$"
                        title="Letras, números, guiones y guiones bajos solamente"
                        required
                    />
                </div>
                <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--color-text-dim)' }}>Contraseña</label>
                    <input
                        type="password"
                        placeholder="Elige una contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }}
                        required
                        minLength={4}
                    />
                </div>
                <button type="submit" className="submit-btn" style={{ width: '100%', marginTop: '10px' }}>Registrarse</button>
            </form>
            {error && <p style={{ color: '#ef4444', marginTop: '15px', textAlign: 'center' }}>{error}</p>}
            {success && <p style={{ color: '#10b981', marginTop: '15px', textAlign: 'center' }}>{success}</p>}

            <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #334155', paddingTop: '20px' }}>
                <p style={{ color: 'var(--color-text-dim)', marginBottom: '10px' }}>¿Ya tienes cuenta?</p>
                <Link href="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                    Iniciar Sesión
                </Link>
            </div>
        </div>
    );
}
