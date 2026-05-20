import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

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

function GestionPresupuestos({ recargar, mes, año, onPresupuestoActualizado }) {
const { usuario } = useAuth()
const [presupuesto, setPresupuesto] = useState(null)
const [totalGastado, setTotalGastado] = useState(0)
const [cargando, setCargando] = useState(true)
const [error, setError] = useState(null)
const [modoEdicion, setModoEdicion] = useState(false)
const [montoInput, setMontoInput] = useState('')
const [guardando, setGuardando] = useState(false)
const [mensaje, setMensaje] = useState(null)

useEffect(() => {
    async function cargarDatos() {
    try {
        setCargando(true)
        setError(null)

        const { data: presData, error: presError } = await supabase
        .from('monthly_budgets')
        .select('*')
        .eq('mes', mes)
        .eq('año', año)
        .eq('user_id', usuario.id)
        .maybeSingle()

        if (presError) throw presError

        const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('monto')
        .eq('tipo', 'gasto')
        .eq('user_id', usuario.id)
        .gte('fecha', `${año}-${String(mes).padStart(2, '0')}-01`)
        .lte('fecha', `${año}-${String(mes).padStart(2, '0')}-31`)

        if (txError) throw txError

        const total = txData.reduce((sum, tx) => sum + parseFloat(tx.monto), 0)

        setPresupuesto(presData)
        setTotalGastado(total)
        setMontoInput(presData ? presData.monto_total.toString() : '')
    } catch (err) {
        setError(err.message)
    } finally {
        setCargando(false)
    }
    }

    cargarDatos()
}, [mes, año, recargar, usuario])

const disponible = presupuesto ? presupuesto.monto_total - totalGastado : 0
const porcentaje = presupuesto
    ? Math.min(Math.round((totalGastado / presupuesto.monto_total) * 100), 100)
    : 0

const getColor = () => {
    if (porcentaje >= 100) return '#EF4444'
    if (porcentaje >= 80) return '#F59E0B'
    if (porcentaje >= 60) return '#FBBF24'
    return '#10B981'
}

const getColorTexto = () => {
    if (porcentaje >= 100) return 'text-red-500'
    if (porcentaje >= 80) return 'text-amber-500'
    if (porcentaje >= 60) return 'text-yellow-500'
    return 'text-emerald-500'
}

const getMensaje = () => {
    if (porcentaje >= 100) return '🚨 ¡Te pasaste del presupuesto!'
    if (porcentaje >= 80) return '⚠️ Cuidado, vas alto'
    if (porcentaje >= 60) return '👀 Atención'
    return '✅ Vas bien'
}

const handleGuardar = async () => {
    if (!montoInput || parseFloat(montoInput) <= 0) return
    setGuardando(true)
    setMensaje(null)

    try {
    const datos = {
        mes,
        año,
        monto_total: parseFloat(montoInput),
        user_id: usuario.id,
    }

    if (presupuesto) {
        const { error } = await supabase
        .from('monthly_budgets')
        .update({ monto_total: datos.monto_total })
        .eq('id', presupuesto.id)
        if (error) throw error
    } else {
        const { error } = await supabase
        .from('monthly_budgets')
        .insert([datos])
        if (error) throw error
    }

    setMensaje({ tipo: 'ok', texto: '✅ Presupuesto guardado' })
    setModoEdicion(false)
    if (onPresupuestoActualizado) onPresupuestoActualizado()
    } catch (err) {
    setMensaje({ tipo: 'error', texto: `❌ Error: ${err.message}` })
    } finally {
    setGuardando(false)
    }
}

const handleEliminar = async () => {
    const confirmacion = window.confirm(
    `¿Eliminar el presupuesto de ${meses[mes - 1]} ${año}?\n\nEsta acción no se puede deshacer.`
    )
    if (!confirmacion) return

    try {
    const { error } = await supabase
        .from('monthly_budgets')
        .delete()
        .eq('id', presupuesto.id)
    if (error) throw error

    setPresupuesto(null)
    setMontoInput('')
    setModoEdicion(false)
    if (onPresupuestoActualizado) onPresupuestoActualizado()
    } catch (err) {
    alert(`❌ Error al eliminar: ${err.message}`)
    }
}

if (cargando) return <p className="text-gray-500">Cargando presupuesto...</p>
if (error) return <p className="text-red-500">Error: {error}</p>

return (
    <div className="bg-gray-100 rounded-xl p-5 text-gray-800">
    <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
        💼 Presupuesto — {meses[mes - 1]} {año}
        </h2>
        <div className="flex gap-2">
        {presupuesto && !modoEdicion && (
            <>
            <button
                onClick={() => { setModoEdicion(true); setMensaje(null) }}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 font-semibold transition-colors"
            >
                ✏️ Editar
            </button>
            <button
                onClick={handleEliminar}
                className="text-sm px-3 py-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 font-semibold transition-colors"
            >
                🗑️ Eliminar
            </button>
            </>
        )}
        </div>
    </div>

    {(!presupuesto || modoEdicion) && (
        <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-600 mb-1">
            {presupuesto ? 'Nuevo monto límite (CLP)' : 'Definir presupuesto mensual (CLP)'}
        </label>
        <div className="flex gap-2">
            <input
            type="number"
            value={montoInput}
            onChange={(e) => setMontoInput(e.target.value)}
            placeholder="Ej: 500000"
            min="1"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
            onClick={handleGuardar}
            disabled={guardando}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors disabled:bg-gray-400"
            >
            {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            {modoEdicion && (
            <button
                onClick={() => { setModoEdicion(false); setMensaje(null) }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold transition-colors"
            >
                Cancelar
            </button>
            )}
        </div>
        {mensaje && (
            <p className={`mt-2 text-sm font-bold ${mensaje.tipo === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
            {mensaje.texto}
            </p>
        )}
        {!presupuesto && (
            <p className="mt-3 text-sm text-gray-400 italic">
            No hay presupuesto definido para este mes.
            </p>
        )}
        </div>
    )}

    {presupuesto && !modoEdicion && (
        <>
        <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Presupuesto</p>
            <p className="font-bold text-gray-800 text-sm">{formatearMonto(presupuesto.monto_total)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Gastado</p>
            <p className="font-bold text-red-500 text-sm">{formatearMonto(totalGastado)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Disponible</p>
            <p className={`font-bold text-sm ${disponible >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatearMonto(disponible)}
            </p>
            </div>
        </div>

        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${porcentaje}%`, background: getColor() }}
            />
        </div>

        <div className="flex justify-between items-center text-sm">
            <span className={`font-bold ${getColorTexto()}`}>{getMensaje()}</span>
            <span className={`font-bold ${getColorTexto()}`}>{porcentaje}% usado</span>
        </div>
        </>
    )}
    </div>
)
}

export default GestionPresupuestos