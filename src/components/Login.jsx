import { useState } from 'react'
import { supabase } from '../lib/supabase'

function Login() {
const [modo, setModo] = useState('login') // 'login' | 'registro'
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [cargando, setCargando] = useState(false)
const [error, setError] = useState(null)
const [mensaje, setMensaje] = useState(null)

const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    setMensaje(null)

    try {
    if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMensaje('✅ Cuenta creada, ya puedes iniciar sesión.')
        setModo('login')
    }
    } catch (err) {
    setError(err.message)
    } finally {
    setCargando(false)
    }
}

const inputClass =
    'w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400'

return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-1">💰 Money Tracker</h1>
        <p className="text-center text-gray-500 text-sm mb-6">
        {modo === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta gratis'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
            <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className={inputClass}
            required
            />
        </div>

        <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Contraseña</label>
            <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
            required
            minLength={6}
            />
        </div>

        {error && (
            <p className="text-red-500 text-sm font-semibold">{error}</p>
        )}
        {mensaje && (
            <p className="text-emerald-600 text-sm font-semibold">{mensaje}</p>
        )}

        <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
            {cargando
            ? 'Cargando...'
            : modo === 'login'
            ? 'Iniciar sesión'
            : 'Crear cuenta'}
        </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
        {modo === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
        <button
            onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setError(null); setMensaje(null) }}
            className="text-blue-500 font-semibold hover:underline"
        >
            {modo === 'login' ? 'Regístrate' : 'Inicia sesión'}
        </button>
        </p>
    </div>
    </div>
)
}

export default Login