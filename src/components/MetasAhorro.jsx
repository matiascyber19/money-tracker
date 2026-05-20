import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const formatearMonto = (monto) =>
new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
}).format(monto)

const formatearFecha = (fecha) => {
if (!fecha) return null
return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
})
}

const formVacio = {
nombre: '',
monto_meta: '',
monto_actual: '',
fecha_limite: '',
}

function MetasAhorro() {
const [metas, setMetas] = useState([])
const [cargando, setCargando] = useState(true)
const [error, setError] = useState(null)
const [mostrarFormulario, setMostrarFormulario] = useState(false)
const [form, setForm] = useState(formVacio)
const [guardando, setGuardando] = useState(false)
const [mensaje, setMensaje] = useState(null)
const [metaEditando, setMetaEditando] = useState(null)

  // abono: { id, valor }
const [abono, setAbono] = useState({})

useEffect(() => {
    cargarMetas()
}, [])

async function cargarMetas() {
    try {
    setCargando(true)
    const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .order('completada', { ascending: true })
        .order('created_at', { ascending: false })

    if (error) throw error
    setMetas(data)
    } catch (err) {
    setError(err.message)
    } finally {
    setCargando(false)
    }
}

const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
}

const handleGuardar = async () => {
    if (!form.nombre || !form.monto_meta) return
    setGuardando(true)
    setMensaje(null)

    try {
    const datos = {
        nombre: form.nombre,
        monto_meta: parseFloat(form.monto_meta),
        monto_actual: parseFloat(form.monto_actual) || 0,
        fecha_limite: form.fecha_limite || null,
    }

    if (metaEditando) {
        const { error } = await supabase
        .from('savings_goals')
        .update(datos)
        .eq('id', metaEditando)
        if (error) throw error
        setMensaje({ tipo: 'ok', texto: '✅ Meta actualizada' })
    } else {
        const { error } = await supabase
        .from('savings_goals')
        .insert([{ ...datos, completada: false }])
        if (error) throw error
        setMensaje({ tipo: 'ok', texto: '✅ Meta creada' })
    }

    setForm(formVacio)
    setMostrarFormulario(false)
    setMetaEditando(null)
    cargarMetas()
    } catch (err) {
    setMensaje({ tipo: 'error', texto: `❌ Error: ${err.message}` })
    } finally {
    setGuardando(false)
    }
}

const handleEditar = (meta) => {
    setForm({
    nombre: meta.nombre,
    monto_meta: meta.monto_meta.toString(),
    monto_actual: meta.monto_actual.toString(),
    fecha_limite: meta.fecha_limite || '',
    })
    setMetaEditando(meta.id)
    setMostrarFormulario(true)
    setMensaje(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleEliminar = async (meta) => {
    const confirmacion = window.confirm(
    `¿Eliminar la meta "${meta.nombre}"?\n\nEsta acción no se puede deshacer.`
    )
    if (!confirmacion) return

    try {
    const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', meta.id)
    if (error) throw error
    cargarMetas()
    } catch (err) {
    alert(`❌ Error al eliminar: ${err.message}`)
    }
}

const handleToggleCompletada = async (meta) => {
    try {
    const { error } = await supabase
        .from('savings_goals')
        .update({ completada: !meta.completada })
        .eq('id', meta.id)
    if (error) throw error
    cargarMetas()
    } catch (err) {
    alert(`❌ Error: ${err.message}`)
    }
}

const handleAbono = async (meta) => {
    const valor = parseFloat(abono[meta.id])
    if (!valor || valor <= 0) return

    try {
    const nuevoMonto = parseFloat(meta.monto_actual) + valor
    const completada = nuevoMonto >= parseFloat(meta.monto_meta)

    const { error } = await supabase
        .from('savings_goals')
        .update({
        monto_actual: nuevoMonto,
        completada,
        })
        .eq('id', meta.id)

    if (error) throw error
    setAbono({ ...abono, [meta.id]: '' })
    cargarMetas()
    } catch (err) {
    alert(`❌ Error: ${err.message}`)
    }
}

const getColorProgreso = (porcentaje) => {
    if (porcentaje >= 100) return '#10B981'
    if (porcentaje >= 60) return '#3B82F6'
    if (porcentaje >= 30) return '#F59E0B'
    return '#EF4444'
}

const getColorTexto = (porcentaje) => {
    if (porcentaje >= 100) return 'text-emerald-500'
    if (porcentaje >= 60) return 'text-blue-500'
    if (porcentaje >= 30) return 'text-amber-500'
    return 'text-red-500'
}

const inputClass =
    'w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
const labelClass = 'block text-sm font-semibold text-gray-600 mb-1'

if (cargando) return <p className="text-gray-500 mt-8">Cargando metas...</p>
if (error) return <p className="text-red-500 mt-8">Error: {error}</p>

return (
    <div className="mt-8">
      {/* Header */}
    <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">🎯 Metas de ahorro</h2>
        {!mostrarFormulario && (
        <button
            onClick={() => {
            setMostrarFormulario(true)
            setMetaEditando(null)
            setForm(formVacio)
            setMensaje(null)
            }}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-colors"
        >
            ➕ Nueva meta
        </button>
        )}
    </div>

      {/* Formulario */}
    {mostrarFormulario && (
        <div className={`rounded-xl p-5 mb-6 ${metaEditando ? 'bg-amber-50 border-2 border-amber-400' : 'bg-gray-50 border border-gray-200'}`}>
        <h3 className="text-lg font-bold text-gray-800 mb-4">
            {metaEditando ? '✏️ Editar meta' : '➕ Nueva meta de ahorro'}
        </h3>

        <div className="space-y-3">
            <div>
            <label className={labelClass}>Nombre</label>
            <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Vacaciones, Notebook, Fondo de emergencia"
                className={inputClass}
            />
            </div>

            <div className="grid grid-cols-2 gap-3">
            <div>
                <label className={labelClass}>Meta (CLP)</label>
                <input
                type="number"
                name="monto_meta"
                value={form.monto_meta}
                onChange={handleChange}
                placeholder="500000"
                min="1"
                className={inputClass}
                />
            </div>
            <div>
                <label className={labelClass}>Ya tengo (CLP)</label>
                <input
                type="number"
                name="monto_actual"
                value={form.monto_actual}
                onChange={handleChange}
                placeholder="0"
                min="0"
                className={inputClass}
                />
            </div>
            </div>

            <div>
            <label className={labelClass}>Fecha límite (opcional)</label>
            <input
                type="date"
                name="fecha_limite"
                value={form.fecha_limite}
                onChange={handleChange}
                className={inputClass}
            />
            </div>

            {mensaje && (
            <p className={`text-sm font-bold ${mensaje.tipo === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
                {mensaje.texto}
            </p>
            )}

            <div className="flex gap-3 pt-1">
            <button
                onClick={handleGuardar}
                disabled={guardando}
                className={`flex-1 py-2.5 rounded-lg font-bold text-white transition-colors ${
                guardando
                    ? 'bg-gray-400 cursor-not-allowed'
                    : metaEditando
                    ? 'bg-amber-400 hover:bg-amber-500'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
            >
                {guardando ? 'Guardando...' : metaEditando ? 'Actualizar meta' : 'Crear meta'}
            </button>
            <button
                onClick={() => {
                setMostrarFormulario(false)
                setMetaEditando(null)
                setForm(formVacio)
                setMensaje(null)
                }}
                className="py-2.5 px-5 rounded-lg font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
                Cancelar
            </button>
            </div>
        </div>
        </div>
    )}

      {/* Lista de metas */}
    {metas.length === 0 ? (
        <div className="bg-gray-100 rounded-xl p-8 text-center text-gray-400">
        <p className="text-4xl mb-2">🎯</p>
        <p className="italic">No tienes metas de ahorro todavía.</p>
        </div>
    ) : (
        <div className="flex flex-col gap-4">
        {metas.map((meta) => {
            const porcentaje = Math.min(
              Math.round((parseFloat(meta.monto_actual) / parseFloat(meta.monto_meta)) * 100),
            100
            )
            const colorBarra = getColorProgreso(porcentaje)
            const colorTexto = getColorTexto(porcentaje)
            const faltante = parseFloat(meta.monto_meta) - parseFloat(meta.monto_actual)

            return (
            <div
                key={meta.id}
                className={`bg-gray-100 rounded-xl p-4 transition-opacity ${
                meta.completada ? 'opacity-70' : 'opacity-100'
                }`}
            >
                {/* Header tarjeta */}
                <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className={`font-bold text-gray-800 text-base ${meta.completada ? 'line-through text-gray-400' : ''}`}>
                    {meta.completada ? '✅' : '🎯'} {meta.nombre}
                    </h3>
                    {meta.fecha_limite && (
                    <p className="text-xs text-gray-400 mt-0.5">
                        📅 Límite: {formatearFecha(meta.fecha_limite)}
                    </p>
                    )}
                </div>
                <div className="flex gap-1.5">
                    <button
                    onClick={() => handleToggleCompletada(meta)}
                    title={meta.completada ? 'Marcar como pendiente' : 'Marcar como completada'}
                    className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-100 transition-colors text-sm"
                    >
                    {meta.completada ? '↩️' : '✔️'}
                    </button>
                    <button
                    onClick={() => handleEditar(meta)}
                    title="Editar"
                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-100 transition-colors text-sm"
                    >
                    ✏️
                    </button>
                    <button
                    onClick={() => handleEliminar(meta)}
                    title="Eliminar"
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 transition-colors text-sm"
                    >
                    🗑️
                    </button>
                </div>
                </div>

                {/* Montos */}
                <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">
                    Ahorrado:{' '}
                    <strong className="text-gray-800">{formatearMonto(meta.monto_actual)}</strong>
                </span>
                <span className="text-gray-500">
                    Meta:{' '}
                    <strong className="text-gray-800">{formatearMonto(meta.monto_meta)}</strong>
                </span>
                </div>

                {/* Barra de progreso */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${porcentaje}%`, background: colorBarra }}
                />
                </div>

                {/* Porcentaje + faltante */}
                <div className="flex justify-between text-xs mb-3">
                <span className={`font-bold ${colorTexto}`}>{porcentaje}% completado</span>
                {!meta.completada && faltante > 0 && (
                    <span className="text-gray-400">
                    Faltan {formatearMonto(faltante)}
                    </span>
                )}
                {meta.completada && (
                    <span className="text-emerald-500 font-bold">¡Meta alcanzada! 🎉</span>
                )}
                </div>

                {/* Agregar abono */}
                {!meta.completada && (
                <div className="flex gap-2 mt-1">
                    <input
                    type="number"
                    value={abono[meta.id] || ''}
                    onChange={(e) => setAbono({ ...abono, [meta.id]: e.target.value })}
                    placeholder="Agregar abono (CLP)"
                    min="1"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                    onClick={() => handleAbono(meta)}
                    disabled={!abono[meta.id]}
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                    Abonar
                    </button>
                </div>
                )}
            </div>
            )
        })}
        </div>
    )}
    </div>
)
}

export default MetasAhorro