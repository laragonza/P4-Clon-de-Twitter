"use client"
import { useState, type FormEvent } from 'react'
import { apiFetch } from '@/api/api'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

export default function Page() {
  // controlo si estamos en login o registro con este estado
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    // el username solo es necesario si estamos registrando
    if (mode === 'register' && !username.trim()) {
      setError('El username es obligatorio')
      return
    }

    // dependiendo del modo llamo a un endpoint u otro
    const path = mode === 'login' ? '/auth/login' : '/auth/register'
    setLoading(true)
    const res = await apiFetch<any>(path, {
      method: 'POST',
      body: JSON.stringify(mode === 'login' ? { email, password } : { username, email, password })
    })
    setLoading(false)

    if (!res.ok) {
      setError((res.data as any)?.error || `Error ${res.status}`)
      return
    }

    const data = res.data as any
    // guardo el token en una cookie y mando al inicio
    if (data?.token) {
      Cookies.set('token', data.token)
      router.push('/')
      return
    }

    setError('La respuesta no incluyó token')
  }

  return (
    <section className="auth-shell">
      <div className="auth-brand">
        <div className="brand" style={{ justifyContent: 'center' }}>
          <span className="brand-word">Nebrija</span><span className="brand-accent">Social</span>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button type="button" className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
            Iniciar sesión
          </button>
          <button type="button" className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
            Crear cuenta
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="field">
              <label>Username</label>
              <input placeholder="tu_usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input placeholder="tu@nebrija.es" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="field">
            <label>Contraseña</label>
            <input placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </div>

          <button className="btn" style={{ width: '100%', marginTop: 8 }} type="submit" disabled={loading}>
            {loading ? 'Enviando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}
      </div>
    </section>
  )
}