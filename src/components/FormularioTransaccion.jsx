import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function FormularioTransaccion({ onTransaccionCreada, transaccionAEditar, onCancelarEdicion }) {
const [categorias, setCategorias] = useState([])
const [enviando, setEnviando] = useState(false)
const [mensaje, setMensaje] = useState(null)

const modoEdicion = !!transaccionAEditar

  // Estado inicial calculado: si hay transacción a editar, usar sus datos; si no, valores vacíos
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

  // Cargar categorías al montar
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

  // Scrollear arriba cuando entra en modo edición
useEffect(() => {
    if (modoEdicion) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    }
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

const handleCancelar = () => {
    if (onCancelarEdicion) onCancelarEdicion()
}

return (
    <div
    style={{
        background: modoEdicion ? '#fef3c7' : '#f9fafb',
        padding: '1.5rem',
        borderRadius: '8px',
        marginTop: '2rem',
        color: '#333',
        border: modoEdicion ? '2px solid #f59e0b' : 'none',
    }}
    >
    <h2 style={{ marginTop: 0 }}>
        {modoEdicion ? '✏️ Editar transacción' : '➕ Nueva transacción'}
    </h2>

    <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Tipo</label>
        <select
            name="tipo"
            value={form.tipo}
            onChange={handleTipoChange}
            style={inputStyle}
            required
        >
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
        </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Categoría</label>
        <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            style={inputStyle}
            required
        >
            <option value="">Selecciona una categoría</option>
            {categoriasFiltradas.map((c) => (
            <option key={c.id} value={c.id}>
                {c.nombre}
            </option>
            ))}
        </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Descripción</label>
        <input
            type="text"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Ej: Almuerzo con amigos"
            style={inputStyle}
            required
        />
        </div>

        <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Monto (CLP)</label>
        <input
            type="number"
            name="monto"
            value={form.monto}
            onChange={handleChange}
            placeholder="10000"
            min="1"
            step="1"
            style={inputStyle}
            required
        />
        </div>

        <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Fecha</label>
        <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            style={inputStyle}
            required
        />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
            type="submit"
            disabled={enviando}
            style={{
            background: enviando ? '#9ca3af' : modoEdicion ? '#f59e0b' : '#3B82F6',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: enviando ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            flex: 1,
            }}
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
            onClick={handleCancelar}
            style={{
                background: '#e5e7eb',
                color: '#333',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
            }}
            >
            Cancelar
            </button>
        )}
        </div>

        {mensaje && (
        <p
            style={{
            marginTop: '1rem',
            color: mensaje.tipo === 'ok' ? '#10B981' : '#EF4444',
            fontWeight: 'bold',
            }}
        >
            {mensaje.texto}
        </p>
        )}
    </form>
    </div>
)
}

const labelStyle = {
display: 'block',
marginBottom: '0.25rem',
fontWeight: 'bold',
}

const inputStyle = {
width: '100%',
padding: '0.5rem',
borderRadius: '4px',
border: '1px solid #d1d5db',
fontSize: '1rem',
background: 'white',
color: '#333',
boxSizing: 'border-box',
}

export default FormularioTransaccion