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

const formatearMonto = (monto) =>
    new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
    }).format(monto)

const formatearFecha = (fecha) =>
    new Date(fecha + 'T00:00:00').toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    })

if (cargando) return <p className="text-gray-500 mt-8">Cargando transacciones...</p>
if (error) return <p className="text-red-500 mt-8">Error: {error}</p>

return (
    <div className="mt-8">
    <h2 className="text-xl font-semibold text-gray-800 mb-3">
        Mis transacciones ({transacciones.length})
    </h2>

    <div className="flex flex-col gap-2">
        {transacciones.map((tx) => {
        const esIngreso = tx.tipo === 'ingreso'
        const estaEliminando = eliminandoId === tx.id

        return (
            <div
            key={tx.id}
            className={`flex items-center justify-between px-4 py-3 bg-gray-100 rounded-lg transition-opacity ${
                estaEliminando ? 'opacity-50' : 'opacity-100'
            }`}
            style={{ borderLeft: `4px solid ${tx.categories?.color || '#999'}` }}
            >
              {/* Info */}
            <div className="flex-1">
                <strong className="text-gray-800">{tx.descripcion}</strong>
                <div className="text-xs text-gray-500 mt-0.5">
                {tx.categories?.nombre || 'Sin categoría'} · {formatearFecha(tx.fecha)}
                </div>
            </div>

              {/* Monto */}
            <div
                className={`font-bold text-base mr-4 ${
                esIngreso ? 'text-emerald-500' : 'text-red-500'
                }`}
            >
                {esIngreso ? '+' : '-'} {formatearMonto(tx.monto)}
            </div>

              {/* Botón editar */}
            <button
                onClick={() => onEditarTransaccion && onEditarTransaccion(tx)}
                disabled={estaEliminando}
                title="Editar"
                className="p-1.5 rounded text-blue-500 hover:bg-blue-100 transition-colors disabled:cursor-not-allowed"
            >
                ✏️
            </button>

              {/* Botón eliminar */}
            <button
                onClick={() => handleEliminar(tx)}
                disabled={estaEliminando}
                title="Eliminar"
                className="p-1.5 rounded text-red-500 hover:bg-red-100 transition-colors disabled:cursor-not-allowed"
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

export default ListaTransacciones