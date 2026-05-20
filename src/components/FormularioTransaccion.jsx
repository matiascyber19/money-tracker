import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

function FormularioTransaccion({ onTransaccionCreada, transaccionAEditar, onCancelarEdicion }) {
const { usuario } = useAuth()
const [categorias, setCategorias] = useState([])
const [enviando, setEnviando] = useState(false)
const [mensaje, setMensaje] = useState(null)

const modoEdicion = !!transaccionAEditar

const formInicial = transaccionAEditar
    ? {
        descripcion: transaccionAEditar.descripcion,
        monto: transaccionAEditar.monto.toString(),
        tipo: transaccionAEditar.tipo,
        category_id: transaccionAEditar.category_id?.toString() || '',
        fecha: transaccionAEditar.fecha,
    }
    : {
        descripcion: '',
        monto: '',
        tipo: 'gasto',
        category_id: '',
        fecha: new Date().toISOString().split('T')[0],
    }

const [form, setForm] = useState(formInicial)

useEffect(() => {
    async function cargarCategorias() {
    const { data, error } = await supabase
        .from('categories')
        .select('id, nombre, tipo')
        .order('nombre')
    if (!error) setCategorias(data)
    }
    cargarCategorias()
}, [])

useEffect(() => {
    if (modoEdicion) window.scrollTo({ top: 0, behavior: 'smooth' })
}, [modoEdicion])

const categoriasFiltradas = categorias.filter((c) => c.tipo === form.tipo)

const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
}

const handleTipoChange = (e) => {
    setForm({ ...form, tipo: e.target.value, category_id: '' })
}

const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setMensaje(null)

    try {
    const datos = {
        descripcion: form.descripcion,
        monto: parseFloat(form.monto),
        tipo: form.tipo,
        category_id: parseInt(form.category_id),
        fecha: form.fecha,
        user_id: usuario.id,
    }

    if (modoEdicion) {
        const { error } = await supabase
        .from('transactions')
        .update(datos)
        .eq('id', transaccionAEditar.id)
        if (error) throw error
        setMensaje({ tipo: 'ok', texto: '✅ Transacción actualizada' })
    } else {
        const { error } = await supabase.from('transactions').insert([datos])
        if (error) throw error
        setMensaje({ tipo: 'ok', texto: '✅ Transacción agregada' })
        setForm({
        descripcion: '',
        monto: '',
        tipo: 'gasto',
        category_id: '',
        fecha: new Date().toISOString().split('T')[0],
        })
    }

    if (onTransaccionCreada) onTransaccionCreada()
    } catch (err) {
    setMensaje({ tipo: 'error', texto: `❌ Error: ${err.message}` })
    } finally {
    setEnviando(false)
    }
}

const inputClass =
    'w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-400'

const labelClass = 'block mb-1 font-semibold text-gray-700 text-sm'

return (
    <div
    className={`mt-8 p-6 rounded-xl ${
        modoEdicion
        ? 'bg-amber-50 border-2 border-amber-400'
        : 'bg-gray-50 border border-gray-200'
    }`}
    >
    <h2 className="text-xl font-bold text-gray-800 mb-4">
        {modoEdicion ? '✏️ Editar transacción' : '➕ Nueva transacción'}
    </h2>

    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
        <label className={labelClass}>Tipo</label>
        <select
            name="tipo"
            value={form.tipo}
            onChange={handleTipoChange}
            className={inputClass}
            required
        >
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
        </select>
        </div>

        <div>
        <label className={labelClass}>Categoría</label>
        <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className={inputClass}
            required
        >
            <option value="">Selecciona una categoría</option>
            {categoriasFiltradas.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
        </select>
        </div>

        <div>
        <label className={labelClass}>Descripción</label>
        <input
            type="text"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Ej: Almuerzo con amigos"
            className={inputClass}
            required
        />
        </div>

        <div>
        <label className={labelClass}>Monto (CLP)</label>
        <input
            type="number"
            name="monto"
            value={form.monto}
            onChange={handleChange}
            placeholder="10000"
            min="1"
            step="1"
            className={inputClass}
            required
        />
        </div>

        <div>
        <label className={labelClass}>Fecha</label>
        <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            className={inputClass}
            required
        />
        </div>

        <div className="flex gap-3 pt-1">
        <button
            type="submit"
            disabled={enviando}
            className={`flex-1 py-2.5 px-6 rounded-lg font-bold text-white text-base transition-colors ${
            enviando
                ? 'bg-gray-400 cursor-not-allowed'
                : modoEdicion
                ? 'bg-amber-400 hover:bg-amber-500'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
        >
            {enviando
            ? 'Guardando...'
            : modoEdicion
            ? 'Actualizar transacción'
            : 'Agregar transacción'}
        </button>

        {modoEdicion && (
            <button
            type="button"
            onClick={onCancelarEdicion}
            className="py-2.5 px-6 rounded-lg font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
            Cancelar
            </button>
        )}
        </div>

        {mensaje && (
        <p className={`font-bold mt-2 ${mensaje.tipo === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
            {mensaje.texto}
        </p>
        )}
    </form>
    </div>
)
}

export default FormularioTransaccion