import Link from 'next/link';

export default function Home() {
  return (
    <div className="app-container" style={{ textAlign: 'center' }}>
      <h1>Padel Rounds</h1>
      <p style={{ marginBottom: '2rem', color: 'var(--color-text-dim)' }}>
        Bienvenido a Padel Rounds. Por favor ingresa directamente al enlace de tu ronda o accede al Panel de Administración.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link href="/admin" className="submit-btn" style={{ textDecoration: 'none' }}>
          Panel de Admin
        </Link>
      </div>
    </div>
  );
}
