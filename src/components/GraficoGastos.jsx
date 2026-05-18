import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const formatearMonto = (monto) => {
return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
}).format(monto)
}

// Componente del tooltip FUERA del componente principal
function CustomTooltip({ active, payload, totalGastado }) {
if (active && payload && payload.length) {
    const item = payload[0].payload
    const porcentaje = ((item.total / totalGastado) * 100).toFixed(1)
    return (
    <div
        style={{
        background: 'white',
        border: '1px solid #ccc',
        padding: '0.5rem 0.75rem',
        borderRadius: '4px',
        color: '#333',
        fontSize: '0.9em',
        }}
    >
        <strong>{item.categoria}</strong>
        <div>{formatearMonto(item.total)}</div>
        <div style={{ color: '#666' }}>
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

if (cargando) return <p>Cargando gráfico...</p>
if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

if (datos.length === 0) {
    return (
    <div
        style={{
        background: '#f5f5f5',
        padding: '2rem',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#666',
        }}
    >
        <h3 style={{ marginTop: 0, color: '#333' }}>🥧 Gastos por categoría</h3>
        <p style={{ fontStyle: 'italic' }}>No hay gastos registrados en este período.</p>
    </div>
    )
}

return (
    <div
    style={{
        background: '#f5f5f5',
        padding: '1rem 1.5rem 1.5rem',
        borderRadius: '8px',
        color: '#333',
    }}
    >
    <h3 style={{ marginTop: 0 }}>🥧 Gastos por categoría</h3>
    <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '1rem' }}>
        Total gastado:{' '}
        <strong style={{ color: '#EF4444' }}>{formatearMonto(totalGastado)}</strong>
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