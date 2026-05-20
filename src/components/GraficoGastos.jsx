import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const formatearMonto = (monto) =>
new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
}).format(monto)

function CustomTooltip({ active, payload, totalGastado }) {
if (active && payload && payload.length) {
    const item = payload[0].payload
    const porcentaje = ((item.total / totalGastado) * 100).toFixed(1)
    return (
    <div className="bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 shadow-sm">
        <strong className="block mb-0.5">{item.categoria}</strong>
        <div>{formatearMonto(item.total)}</div>
        <div className="text-gray-500">
        {porcentaje}% · {item.cantidad} transacción{item.cantidad > 1 ? 'es' : ''}
        </div>
    </div>
    )
}
return null
}

function GraficoGastos({ recargar, mes, año }) {
const [datos, setDatos] = useState([])
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
        setDatos(data)
    } catch (err) {
        setError(err.message)
    } finally {
        setCargando(false)
    }
    }

    cargarGastos()
}, [mes, año, recargar])

const totalGastado = datos.reduce((sum, d) => sum + parseFloat(d.total), 0)

if (cargando) return <p className="text-gray-500">Cargando gráfico...</p>
if (error) return <p className="text-red-500">Error: {error}</p>

if (datos.length === 0) {
    return (
    <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">🥧 Gastos por categoría</h3>
        <p className="italic">No hay gastos registrados en este período.</p>
    </div>
    )
}

return (
    <div className="bg-gray-100 rounded-lg px-6 pt-4 pb-6 text-gray-800">
    <h3 className="text-lg font-semibold mb-1">🥧 Gastos por categoría</h3>
    <p className="text-sm text-gray-500 mb-4">
        Total gastado:{' '}
        <strong className="text-red-500">{formatearMonto(totalGastado)}</strong>
    </p>

    <ResponsiveContainer width="100%" height={280}>
        <PieChart>
        <Pie
            data={datos}
            dataKey="total"
            nameKey="categoria"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={45}
            paddingAngle={2}
            label={(entry) => `${((entry.total / totalGastado) * 100).toFixed(0)}%`}
        >
            {datos.map((entry) => (
            <Cell key={entry.category_id} fill={entry.color} />
            ))}
        </Pie>
        <Tooltip content={<CustomTooltip totalGastado={totalGastado} />} />
        <Legend verticalAlign="bottom" height={36} />
        </PieChart>
    </ResponsiveContainer>
    </div>
)
}

export default GraficoGastos