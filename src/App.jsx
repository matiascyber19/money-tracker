import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './lib/AuthContext'
import Login from './components/Login'
import ListaTransacciones from './components/ListaTransacciones'
import FormularioTransaccion from './components/FormularioTransaccion'
import Dashboard from './components/Dashboard'
import GraficoGastos from './components/GraficoGastos'
import GestionPresupuestos from './components/GestionPresupuestos'
import MetasAhorro from './components/MetasAhorro'
import './App.css'

function App() {
  const { usuario, cargando: cargandoAuth, cerrarSesion } = useAuth()

  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [recargarLista, setRecargarLista] = useState(0)
  const [transaccionAEditar, setTransaccionAEditar] = useState(null)

  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [año, setAño] = useState(hoy.getFullYear())

  useEffect(() => {
    if (!usuario) return

    async function cargarCategorias() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('id', { ascending: true })

        if (error) throw error
        setCategorias(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }

    cargarCategorias()
  }, [usuario])

  const handleTransaccionCreada = () => {
    setRecargarLista((prev) => prev + 1)
    setTransaccionAEditar(null)
  }

  const handleEditarTransaccion = (tx) => {
    setTransaccionAEditar(tx)
  }

  const handleCancelarEdicion = () => {
    setTransaccionAEditar(null)
  }

  if (cargandoAuth) return <p className="text-center mt-10 text-gray-500">Cargando...</p>
  if (!usuario) return <Login />
  if (cargando) return <p className="text-center mt-10 text-gray-500">Cargando...</p>
  if (error) return <p className="text-center mt-10 text-red-500">Error: {error}</p>

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 font-sans">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">💰 Money Tracker</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{usuario.email}</span>
          <button
            onClick={cerrarSesion}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex flex-col gap-6">
          <GestionPresupuestos
            recargar={recargarLista}
            mes={mes}
            año={año}
            onPresupuestoActualizado={handleTransaccionCreada}
          />
          <Dashboard
            recargar={recargarLista}
            mes={mes}
            setMes={setMes}
            año={año}
            setAño={setAño}
          />
        </div>
        <GraficoGastos recargar={recargarLista} mes={mes} año={año} />
      </div>

      {/* Categorías */}
      <h2 className="text-xl font-semibold text-gray-700 mb-3">
        Mis categorías ({categorias.length})
      </h2>
      <ul className="space-y-2 mb-8">
        {categorias.map((cat) => (
          <li
            key={cat.id}
            className="flex items-center px-4 py-3 bg-gray-100 rounded-md"
            style={{ borderLeft: `4px solid ${cat.color}` }}
          >
            <strong className="text-gray-800">{cat.nombre}</strong>
            <span className="ml-3 text-sm text-gray-500">({cat.tipo})</span>
          </li>
        ))}
      </ul>

      <FormularioTransaccion
        key={transaccionAEditar?.id || 'nuevo'}
        onTransaccionCreada={handleTransaccionCreada}
        transaccionAEditar={transaccionAEditar}
        onCancelarEdicion={handleCancelarEdicion}
      />

      <ListaTransacciones
        recargar={recargarLista}
        onEditarTransaccion={handleEditarTransaccion}
      />

      <MetasAhorro />
    </div>
  )
}

export default App