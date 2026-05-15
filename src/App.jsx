import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import ListaTransacciones from './components/ListaTransacciones'
import './App.css'

function App() {
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
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
  }, [])

  if (cargando) return <p>Cargando...</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>💰 Money Tracker</h1>

      <h2>Mis categorías ({categorias.length})</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {categorias.map((cat) => (
          <li
            key={cat.id}
            style={{
              padding: '0.75rem 1rem',
              margin: '0.5rem 0',
              borderLeft: `4px solid ${cat.color}`,
              background: '#f5f5f5',
              borderRadius: '4px',
              color: '#333',
            }}
          >
            <strong>{cat.nombre}</strong>
            <span style={{ marginLeft: '1rem', color: '#666', fontSize: '0.9em' }}>
              ({cat.tipo})
            </span>
          </li>
        ))}
      </ul>

      <ListaTransacciones />
    </div>
  )
}

export default App