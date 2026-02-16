'use client';

import React, { useState } from 'react';

interface RoundWizardProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function RoundWizard({ onClose, onSuccess }: RoundWizardProps) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [courts, setCourts] = useState<string[]>([]);
    const [currentCourt, setCurrentCourt] = useState('');
    const [maxPairs, setMaxPairs] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const totalSteps = 4;

    const handleAddCourt = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentCourt.trim()) {
            setCourts([...courts, currentCourt.trim()]);
            setCurrentCourt('');
        }
    };

    const removeCourt = (index: number) => {
        setCourts(courts.filter((_, i) => i !== index));
    };

    const handleNext = () => {
        if (step === 1 && !name.trim()) return;
        setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setIsSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/rounds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    max_pairs: maxPairs ? parseInt(maxPairs) : null,
                    courts: courts.join(', ')
                }),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                setError(data.error || 'Error al crear la ronda');
                setIsSubmitting(false);
            }
        } catch (err) {
            setError('Error de conexión');
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: '#1e293b',
                padding: '40px',
                borderRadius: '20px',
                width: '90%',
                maxWidth: '600px',
                border: '1px solid #334155',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-primary)' }}>
                        Nueva Partida {step}/{totalSteps}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                {/* Step 1: Name */}
                {step === 1 && (
                    <div>
                        <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>¿Cómo se llamará esta partida?</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Ejemplo: "Torneo Sábado", "Pista 1", "Cervezas Padel"</p>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nombre de la partida"
                            style={{
                                width: '100%',
                                padding: '15px',
                                fontSize: '1.2rem',
                                borderRadius: '10px',
                                border: '1px solid #334155',
                                background: '#0f172a',
                                color: 'white',
                                marginBottom: '20px'
                            }}
                            autoFocus
                        />
                    </div>
                )}

                {/* Step 2: Courts */}
                {step === 2 && (
                    <div>
                        <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>¿En qué canchas jugarán?</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Agrega las canchas disponibles.</p>

                        <form onSubmit={handleAddCourt} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <input
                                type="text"
                                value={currentCourt}
                                onChange={(e) => setCurrentCourt(e.target.value)}
                                placeholder="Nombre de cancha (ej. Pista 1)"
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #334155',
                                    background: '#0f172a',
                                    color: 'white'
                                }}
                                autoFocus
                            />
                            <button
                                type="submit"
                                style={{
                                    padding: '12px 20px',
                                    background: 'var(--color-primary)',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Añadir
                            </button>
                        </form>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', minHeight: '100px' }}>
                            {courts.length === 0 && <p style={{ color: '#475569', fontStyle: 'italic' }}>No has agregado canchas aún.</p>}
                            {courts.map((court, index) => (
                                <div key={index} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '8px 12px',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <span>{court}</span>
                                    <button
                                        onClick={() => removeCourt(index)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Settings */}
                {step === 3 && (
                    <div>
                        <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Configuración (Opcional)</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '20px' }}>¿Hay un límite de parejas?</p>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '10px', color: '#94a3b8' }}>Límite de Parejas (Dejar vacío para ilimitado)</label>
                            <input
                                type="number"
                                placeholder="Ej. 12"
                                value={maxPairs}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                onChange={(e) => setMaxPairs(e.target.value)}
                                min="1"
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    fontSize: '1.1rem',
                                    borderRadius: '10px',
                                    border: '1px solid #334155',
                                    background: '#0f172a',
                                    color: 'white'
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <div>
                        <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Resumen</h3>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ marginBottom: '15px' }}>
                                <span style={{ color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Nombre</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{name}</span>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <span style={{ color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Canchas ({courts.length})</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                                    {courts.length > 0 ? courts.map((c, i) => (
                                        <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.9rem' }}>{c}</span>
                                    )) : <span style={{ color: '#ef4444' }}>Ninguna (Se asignarán manualmente)</span>}
                                </div>
                            </div>

                            <div>
                                <span style={{ color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Límite</span>
                                <span style={{ fontSize: '1.1rem' }}>{maxPairs ? `${maxPairs} Parejas` : 'Sin límite'}</span>
                            </div>
                        </div>

                        {error && <p style={{ color: '#ef4444', marginTop: '20px', textAlign: 'center' }}>{error}</p>}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', borderTop: '1px solid #334155', paddingTop: '20px' }}>
                    {step > 1 ? (
                        <button
                            onClick={handleBack}
                            style={{
                                background: 'transparent',
                                border: '1px solid #94a3b8',
                                color: '#94a3b8',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            Atrás
                        </button>
                    ) : (
                        <div></div> // Spacer
                    )}

                    {step < totalSteps ? (
                        <button
                            onClick={handleNext}
                            disabled={step === 1 && !name.trim()}
                            style={{
                                background: step === 1 && !name.trim() ? '#475569' : 'var(--color-primary)',
                                color: step === 1 && !name.trim() ? '#94a3b8' : '#000',
                                border: 'none',
                                padding: '10px 30px',
                                borderRadius: '8px',
                                cursor: step === 1 && !name.trim() ? 'not-allowed' : 'pointer',
                                fontSize: '1rem',
                                fontWeight: 'bold'
                            }}
                        >
                            Siguiente
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            style={{
                                background: isSubmitting ? '#475569' : 'var(--color-primary)',
                                color: isSubmitting ? '#94a3b8' : '#000',
                                border: 'none',
                                padding: '10px 30px',
                                borderRadius: '8px',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                fontSize: '1rem',
                                fontWeight: 'bold'
                            }}
                        >
                            {isSubmitting ? 'Creando...' : 'Crear Partida'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
