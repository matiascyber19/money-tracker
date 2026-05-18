import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

function FormularioTransaccion({ onTransaccionCreada }) {
const [categorias, setCategorias] = useState([]);
const [enviando, setEnviando] = useState(false);
const [mensaje, setMensaje] = useState(null);

  // Estado del formulario
const [form, setForm] = useState({
    descripcion: "",
    monto: "",
    tipo: "gasto",
    category_id: "",
    fecha: new Date().toISOString().split("T")[0], // hoy en formato YYYY-MM-DD
});

  // Cargar categorías para el select
useEffect(() => {
    async function cargarCategorias() {
    const { data, error } = await supabase
        .from("categories")
        .select("id, nombre, tipo")
        .order("nombre");

    if (!error) setCategorias(data);
    }
    cargarCategorias();
}, []);

  // Filtrar categorías según el tipo seleccionado
const categoriasFiltradas = categorias.filter((c) => c.tipo === form.tipo);

  // Manejar cambios en los inputs
const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
};

  // Cambiar tipo resetea la categoría (porque las categorías dependen del tipo)
const handleTipoChange = (e) => {
    setForm({ ...form, tipo: e.target.value, category_id: "" });
};

  // Enviar el formulario
const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);

    try {
    const { error } = await supabase.from("transactions").insert([
        {
        descripcion: form.descripcion,
        monto: parseFloat(form.monto),
        tipo: form.tipo,
        category_id: parseInt(form.category_id),
        fecha: form.fecha,
        },
    ]);

    if (error) throw error;

      // Resetear formulario
    setForm({
        descripcion: "",
        monto: "",
        tipo: "gasto",
        category_id: "",
        fecha: new Date().toISOString().split("T")[0],
    });

    setMensaje({ tipo: "ok", texto: "✅ Transacción agregada" });

      // Avisar al padre que se creó algo (para refrescar la lista)
    if (onTransaccionCreada) onTransaccionCreada();
    } catch (err) {
    setMensaje({ tipo: "error", texto: `❌ Error: ${err.message}` });
    } finally {
    setEnviando(false);
    }
};

return (
    <div
    style={{
        background: "#246db6",
        padding: "1.5rem",
        borderRadius: "8px",
        marginTop: "2rem",
        color: "#333",
    }}
    >
    <h2 style={{ marginTop: 0 }}>➕ Nueva transacción</h2>

    <form onSubmit={handleSubmit}>
        {/* Tipo */}
        <div style={{ marginBottom: "1rem" }}>
        <label
            style={{
            display: "block",
            marginBottom: "0.25rem",
            fontWeight: "bold",
            }}
        >
            Tipo
        </label>
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

        {/* Categoría */}
        <div style={{ marginBottom: "1rem" }}>
        <label
            style={{
            display: "block",
            marginBottom: "0.25rem",
            fontWeight: "bold",
            }}
        >
            Categoría
        </label>
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

        {/* Descripción */}
        <div style={{ marginBottom: "1rem" }}>
        <label
            style={{
            display: "block",
            marginBottom: "0.25rem",
            fontWeight: "bold",
            }}
        >
            Descripción
        </label>
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

        {/* Monto */}
        <div style={{ marginBottom: "1rem" }}>
        <label
            style={{
            display: "block",
            marginBottom: "0.25rem",
            fontWeight: "bold",
            }}
        >
            Monto (CLP)
        </label>
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

        {/* Fecha */}
        <div style={{ marginBottom: "1rem" }}>
        <label
            style={{
            display: "block",
            marginBottom: "0.25rem",
            fontWeight: "bold",
            }}
        >
            Fecha
        </label>
        <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            style={inputStyle}
            required
        />
        </div>

        {/* Botón */}
        <button
        type="submit"
        disabled={enviando}
        style={{
            background: enviando ? "#9ca3af" : "#3B82F6",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "6px",
            cursor: enviando ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
        }}
        >
        {enviando ? "Guardando..." : "Agregar transacción"}
        </button>

        {/* Mensaje de éxito/error */}
        {mensaje && (
        <p
            style={{
            marginTop: "1rem",
            color: mensaje.tipo === "ok" ? "#10B981" : "#EF4444",
            fontWeight: "bold",
            }}
        >
            {mensaje.texto}
        </p>
        )}
    </form>
    </div>
);
}

// Estilos compartidos para los inputs
const inputStyle = {
width: "100%",
padding: "0.5rem",
borderRadius: "4px",
border: "1px solid #d1d5db",
fontSize: "1rem",
background: "white",
color: "#333",
boxSizing: "border-box",
};

export default FormularioTransaccion;
