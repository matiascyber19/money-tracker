import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function Dashboard({ recargar, mes, setMes, año, setAño }) {
const [presupuestos, setPresupuestos] = useState([])
const [cargando, setCargando] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
    async function cargarPresupuestos() {
    try {
        setCargando(true)
        const { data, error } = await supabase
        .from('budget_summary')
        .select('*')
        .eq('mes', mes)
        .eq('año', año)
        .order('porcentaje_usado', { ascending: false })

        if (error) throw error
        setPresupuestos(data)
    } catch (err) {
        setError(err.message)
    } finally {
        setCargando(false)
    }
    }

    cargarPresupuestos()
}, [mes, año, recargar])

const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
    }).format(monto)
}

  // Color de la barra según el % usado
const getColorBarra = (porcentaje) => {
    if (porcentaje >= 100) return '#EF4444'
    if (porcentaje >= 80) return '#F59E0B'
    if (porcentaje >= 60) return '#FBBF24'
    return '#10B981'
}

  // Mensaje según el % usado
const getMensaje = (porcentaje) => {
    if (porcentaje >= 100) return '🚨 ¡Te pasaste del presupuesto!'
    if (porcentaje >= 80) return '⚠️ Cuidado, vas alto'
    if (porcentaje >= 60) return '👀 Atención'
    return '✅ Vas bien'
}

const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

if (cargando) return <p>Cargando dashboard...</p>
if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

return (
    <div>
    <div
        style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        }}
    >
        <h2 style={{ margin: 0 }}>📊 Dashboard</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
        <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            style={selectStyle}
        >
            {meses.map((nombre, i) => (
            <option key={i + 1} value={i + 1}>
                {nombre}
            </option>
            ))}
        </select>
        <select
            value={año}
            onChange={(e) => setAño(parseInt(e.target.value))}
            style={selectStyle}
        >
            {[2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>
                {y}
            </option>
            ))}
        </select>
        </div>
    </div>

    {presupuestos.length === 0 ? (
        <p style={{ color: '#999', fontStyle: 'italic' }}>
        No hay presupuestos para {meses[mes - 1]} {año}.
        </p>
    ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {presupuestos.map((p) => {
            const colorBarra = getColorBarra(p.porcentaje_usado)
            const anchoBarra = Math.min(p.porcentaje_usado, 100)
            return (
            <div
                key={p.budget_id}
                style={{
                background: '#f5f5f5',
                padding: '1rem',
                borderRadius: '8px',
                borderLeft: `4px solid ${p.categoria_color}`,
                color: '#333',
                }}
            >
                <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                }}
                >
                <strong style={{ fontSize: '1.1em' }}>{p.categoria}</strong>
                <span style={{ fontWeight: 'bold', color: colorBarra }}>
                    {p.porcentaje_usado}%
                </span>
                </div>

                <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.9em',
                    color: '#666',
                    marginBottom: '0.5rem',
                }}
                >
                <span>
                    Gastado: <strong style={{ color: '#333' }}>{formatearMonto(p.gastado)}</strong>
                </span>
                <span>
                    Disponible:{' '}
                    <strong style={{ color: '#333' }}>{formatearMonto(p.disponible)}</strong>
                </span>
                </div>

                <div
                style={{
                    width: '100%',
                    height: '10px',
                    background: '#e5e7eb',
                    borderRadius: '5px',
                    overflow: 'hidden',
                }}
                >
                <div
                    style={{
                    width: `${anchoBarra}%`,
                    height: '100%',
                    background: colorBarra,
                    transition: 'width 0.3s ease',
                    }}
                />
                </div>

                <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85em',
                    marginTop: '0.5rem',
                }}
                >
                <span style={{ color: colorBarra, fontWeight: 'bold' }}>
                    {getMensaje(p.porcentaje_usado)}
                </span>
                <span style={{ color: '#666' }}>de {formatearMonto(p.presupuesto)}</span>
                </div>
            </div>
            )
        })}
        </div>
    )}
    </div>
)
}

const selectStyle = {
padding: '0.4rem 0.6rem',
borderRadius: '4px',
border: '1px solid #d1d5db',
fontSize: '0.9rem',
background: 'white',
color: '#333',
cursor: 'pointer',
}

export default Dashboard