import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

export const AuthContext = createContext({})

export function AuthProvider({ children }) {
const [usuario, setUsuario] = useState(null)
const [cargando, setCargando] = useState(true)

useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
    setUsuario(session?.user ?? null)
    setCargando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUsuario(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
}, [])

const cerrarSesion = async () => {
    await supabase.auth.signOut()
}

return (
    <AuthContext.Provider value={{ usuario, cargando, cerrarSesion }}>
    {children}
    </AuthContext.Provider>
)
}

export function useAuth() {
return useContext(AuthContext)
}