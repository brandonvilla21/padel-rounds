'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="app-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Padel Rounds</h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--color-text-dim)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
        Crea rondas, genera partidos y lleva el marcador en tiempo real.
        Gestiona la lista de espera por orden de llegada para que los jugadores aseguren su lugar (y no se peleen en whatsapp).
      </p>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/login" className="submit-btn" style={{ textDecoration: 'none', padding: '15px 30px', fontSize: '1.1rem' }}>
          Iniciar Sesión
        </Link>
        <Link href="/register" className="submit-btn" style={{ textDecoration: 'none', padding: '15px 30px', fontSize: '1.1rem', background: 'var(--color-surface-hover)', border: '1px solid var(--color-primary)' }}>
          Registrarse
        </Link>
      </div>

      <div style={{ marginTop: '20px' }}>
        <a
          href="https://youtube.com/shorts/Ua0yXA2HdP8?feature=shared"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            textDecoration: 'none',
            fontSize: '0.9rem',
            color: 'var(--color-text-dim)',
            border: '1px solid var(--color-surface-hover)',
            padding: '10px 20px',
            borderRadius: '20px',
            transition: 'all 0.2s',
            display: 'inline-block',
            background: 'rgba(255, 255, 255, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-surface-hover)';
            e.currentTarget.style.color = 'var(--color-text-dim)';
          }}
        >
          Ver Tutorial 📺
        </a>
      </div>

      <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--color-surface-hover)' }}>
        <p style={{ color: 'var(--color-text-dim)' }}>
          ¿Ya tienes una ronda activa? Pregunta a tu administrador por el enlace.
        </p>
      </div>
    </div>
  );
}
