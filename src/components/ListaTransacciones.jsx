import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function ListaTransacciones({ recargar, onTransaccionEliminada, onEditarTransaccion }) {
const [transacciones, setTransacciones] = useState([])
const [cargando, setCargando] = useState(true)
const [error, setError] = useState(null)
const [eliminandoId, setEliminandoId] = useState(null)

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
            category_id,
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
}, [recargar])

const handleEliminar = async (tx) => {
    const confirmacion = window.confirm(
    `¿Eliminar esta transacción?\n\n"${tx.descripcion}" — ${formatearMonto(tx.monto)}\n\nEsta acción no se puede deshacer.`
    )
    if (!confirmacion) return

    setEliminandoId(tx.id)

    try {
    const { error } = await supabase.from('transactions').delete().eq('id', tx.id)
    if (error) throw error

    setTransacciones((prev) => prev.filter((t) => t.id !== tx.id))
    if (onTransaccionEliminada) onTransaccionEliminada()
    } catch (err) {
    alert(`❌ Error al eliminar: ${err.message}`)
    } finally {
    setEliminandoId(null)
    }
}

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
        const estaEliminando = eliminandoId === tx.id
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
                opacity: estaEliminando ? 0.5 : 1,
                transition: 'opacity 0.2s',
            }}
            >
            <div style={{ flex: 1 }}>
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
                marginRight: '1rem',
                }}
            >
                {esIngreso ? '+' : '-'} {formatearMonto(tx.monto)}
            </div>

            <button
                onClick={() => onEditarTransaccion && onEditarTransaccion(tx)}
                disabled={estaEliminando}
                title="Editar"
                style={botonAccionStyle('#3B82F6')}
                onMouseOver={(e) => (e.currentTarget.style.background = '#dbeafe')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
                ✏️
            </button>

            <button
                onClick={() => handleEliminar(tx)}
                disabled={estaEliminando}
                title="Eliminar"
                style={botonAccionStyle('#EF4444')}
                onMouseOver={(e) => (e.currentTarget.style.background = '#fee2e2')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
                🗑️
            </button>
            </div>
        )
        })}
    </div>
    </div>
)
}

const botonAccionStyle = (color) => ({
background: 'transparent',
border: 'none',
cursor: 'pointer',
fontSize: '1.1em',
padding: '0.25rem 0.5rem',
borderRadius: '4px',
color: color,
transition: 'background 0.2s',
})

export default ListaTransacciones