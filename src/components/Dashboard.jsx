import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const formatearMonto = (monto) =>
new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
}).format(monto)

const meses = [
'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function Dashboard({ recargar, mes, setMes, año, setAño }) {
const [gastos, setGastos] = useState([])
const [cargando, setCargando] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
    async function cargarGastos() {
    try {
        setCargando(true)
        const { data, error } = await supabase
        .from('gastos_por_categoria')
        .select('*')
        .eq('mes', mes)
        .eq('año', año)
        .order('total', { ascending: false })

        if (error) throw error
        setGastos(data)
    } catch (err) {
        setError(err.message)
    } finally {
        setCargando(false)
    }
    }

    cargarGastos()
}, [mes, año, recargar])

const totalGastado = gastos.reduce((sum, g) => sum + parseFloat(g.total), 0)

if (cargando) return <p className="text-gray-500">Cargando dashboard...</p>
if (error) return <p className="text-red-500">Error: {error}</p>

return (
    <div className="bg-gray-100 rounded-xl p-5 text-gray-800">
      {/* Header con selectores */}
    <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">📊 Gastos por categoría</h2>
        <div className="flex gap-2">
        <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
            {meses.map((nombre, i) => (
            <option key={i + 1} value={i + 1}>{nombre}</option>
            ))}
        </select>
        <select
            value={año}
            onChange={(e) => setAño(parseInt(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
            {[2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y}</option>
            ))}
        </select>
        </div>
    </div>

      {/* Total del mes */}
    {gastos.length > 0 && (
        <div className="bg-white rounded-lg px-4 py-3 mb-4 flex justify-between items-center">
        <span className="text-sm text-gray-500 font-medium">Total gastado</span>
        <span className="font-bold text-red-500">{formatearMonto(totalGastado)}</span>
        </div>
    )}

      {/* Lista de categorías */}
    {gastos.length === 0 ? (
        <p className="text-gray-400 italic text-sm">
        No hay gastos registrados en {meses[mes - 1]} {año}.
        </p>
    ) : (
        <div className="flex flex-col gap-3">
        {gastos.map((g) => {
            const porcentaje = Math.round((parseFloat(g.total) / totalGastado) * 100)
            return (
            <div
                key={g.category_id}
                className="bg-white rounded-lg px-4 py-3"
                style={{ borderLeft: `4px solid ${g.color}` }}
            >
                {/* Nombre + monto */}
                <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-gray-800">{g.categoria}</span>
                <span className="font-bold text-gray-700">{formatearMonto(g.total)}</span>
                </div>

                {/* Barra de proporción */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${porcentaje}%`, background: g.color }}
                />
                </div>

                {/* Porcentaje + transacciones */}
                <div className="flex justify-between text-xs text-gray-400">
                <span>{porcentaje}% del total</span>
                <span>{g.cantidad} transacción{g.cantidad > 1 ? 'es' : ''}</span>
                </div>
            </div>
            )
        })}
        </div>
    )}
    </div>
)
}

export default Dashboard