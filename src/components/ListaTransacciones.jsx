import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function ListaTransacciones({ recargar }) {
const [transacciones, setTransacciones] = useState([])
const [cargando, setCargando] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
    async function cargarTransacciones() {
    try {
        setCargando(true)
        const { data, error } = await supabase
        .from('transactions')
        .select(`
            id,
            monto,
            tipo,
            descripcion,
            fecha,
            categories (
            nombre,
            color,
            icono
            )
        `)
        .order('fecha', { ascending: false })

        if (error) throw error
        setTransacciones(data)
    } catch (err) {
        setError(err.message)
    } finally {
        setCargando(false)
    }
    }

    cargarTransacciones()
  }, [recargar]) // 👈 cuando cambie 'recargar', se vuelve a ejecutar

const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
    }).format(monto)
}

const formatearFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    })
}

if (cargando) return <p>Cargando transacciones...</p>
if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

return (
    <div style={{ marginTop: '2rem' }}>
    <h2>Mis transacciones ({transacciones.length})</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {transacciones.map((tx) => {
        const esIngreso = tx.tipo === 'ingreso'
        return (
            <div
            key={tx.id}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: '#f5f5f5',
                borderRadius: '8px',
                borderLeft: `4px solid ${tx.categories?.color || '#999'}`,
                color: '#333',
            }}
            >
            <div>
                <strong>{tx.descripcion}</strong>
                <div style={{ fontSize: '0.85em', color: '#666', marginTop: '2px' }}>
                {tx.categories?.nombre || 'Sin categoría'} · {formatearFecha(tx.fecha)}
                </div>
            </div>
            <div
                style={{
                fontWeight: 'bold',
                color: esIngreso ? '#10B981' : '#EF4444',
                fontSize: '1.05em',
                }}
            >
                {esIngreso ? '+' : '-'} {formatearMonto(tx.monto)}
            </div>
            </div>
        )
        })}
    </div>
    </div>
)
}

export default ListaTransacciones