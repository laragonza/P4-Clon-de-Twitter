"use client"
import { useState } from 'react'
import Cookies from 'js-cookie'
import { apiFetch } from '@/api/api'

export default function DebugPage() {
  const [token, setToken] = useState(Cookies.get('token') || '')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const TEST_TOKEN = ''

  async function callApi() {
    setLoading(true)
    setResult(null)
    try {
      const res = await apiFetch('/posts?page=1')
      setResult(res)
    } catch (err) {
      setResult({ ok: false, error: String(err) })
    } finally {
      setLoading(false)
    }
  }

  function applyTestToken() {
    if (!TEST_TOKEN) {
      alert('No TEST_TOKEN embedded. Use /auth to login or paste your token into the console.')
      return
    }
    Cookies.set('token', TEST_TOKEN)
    setToken(TEST_TOKEN)
    alert('Test token set in cookie (dev only)')
  }

  function clearToken() {
    Cookies.remove('token')
    setToken('')
    setResult(null)
    alert('Token cookie removed')
  }

  return (
    <main style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>Debug / Diagnostic</h1>
      <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL}</p>
      <p><strong>NEXT_PUBLIC_STUDENT_NAME:</strong> {process.env.NEXT_PUBLIC_STUDENT_NAME}</p>
      <p><strong>Cookie token:</strong> {token || <i>no token</i>}</p>

      <div style={{ marginTop: 12 }}>
        <button onClick={callApi} disabled={loading}>{loading ? 'Calling...' : 'Call GET /posts?page=1 via apiFetch'}</button>
        <button onClick={clearToken} style={{ marginLeft: 8 }}>Clear token cookie</button>
        <button onClick={applyTestToken} style={{ marginLeft: 8 }}>Set embedded TEST token (none)</button>
      </div>

      <section style={{ marginTop: 20 }}>
        <h2>Result</h2>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f6f6', padding: 12, borderRadius: 6 }}>
          {result ? JSON.stringify(result, null, 2) : 'No result yet'}
        </pre>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Quick test credentials</h2>
        <p>Use these to register/login via the app at <code>/auth</code>:</p>
        <ul>
          <li>username: <code>testuser_lari</code></li>
          <li>email: <code>testuser_lari@example.com</code></li>
          <li>password: <code>Testpass123</code></li>
        </ul>
      </section>
    </main>
  )
}