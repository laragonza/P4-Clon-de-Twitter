"use client"
import { useEffect, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { apiFetch, pickAuthor, pickText, pickUserIdentifier } from '@/api/api'
import Link from 'next/link'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

type ApiError = Error & { status?: number; data?: any }

// esto es el fetcher que usa SWR para pedir los datos
const fetcher = async (url: string) => {
  const res = await apiFetch<any>(url)
  if (!res.ok) {
    // si falla creo un error con el status para poder manejarlo luego
    const err = new Error(`API ${res.status}`) as ApiError
    err.status = res.status
    err.data = res.data
    throw err
  }
  return res.data
}

export default function Page() {
  const [page, setPage] = useState(1)
  const [newPost, setNewPost] = useState('')
  const [sendingPost, setSendingPost] = useState(false)
  const router = useRouter()

  // si no hay token en la cookie mando al login
  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) router.replace('/auth')
  }, [router])

  // pido los posts de la página actual
  const { data, error } = useSWR<any, ApiError>(`/home?page=${page}`, fetcher)

  // para crear un post nuevo
  async function createPost(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = newPost.trim()
    if (!trimmed || sendingPost) return

    setSendingPost(true)
    const res = await apiFetch('/posts', {
      method: 'POST',
      body: JSON.stringify({ contenido: trimmed })
    })
    setSendingPost(false)

    if (!res.ok) {
      alert(`No se pudo publicar (${res.status})`)
      return
    }

    setNewPost('')
    setPage(1)
  }

  // para dar like o retweet a un post
  async function toggleAction(id: string, action: string) {
    const res = await apiFetch(`/posts/${id}/${action}`, { method: 'POST' })
    if (!res.ok) {
      alert(`No se pudo actualizar ${action}`)
      return
    }
    window.location.reload()
  }

  if (error) {
    // si es 401 o 403 significa que no está logueado
    if (error.status === 401 || error.status === 403) {
      router.replace('/auth')
      return <div>Redirigiendo a inicio de sesión...</div>
    }
    return (
      <div>
        <h3>Error loading posts</h3>
        <div>Status: {error.status}</div>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(error.data, null, 2)}</pre>
      </div>
    )
  }
  // mientras carga muestro este mensaje
  if (!data) {
    return <div>Cargando publicaciones...</div>
  }

  // la api puede devolver los posts en distintos campos dependiendo del endpoint
  const posts = data.results || data.posts || []
  const currentPage = data.pagina || data.page || page
  const totalPages = data.totalPaginas || data.totalPages || currentPage
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <>
      <form onSubmit={createPost} className="compose-wrap">
        <div className="compose-head">
          <div className="avatar-round">?</div>
          <div style={{ flex: 1 }}>
            <textarea
              className="textarea"
              placeholder="¿Qué hay de nuevo en Nebrija?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="compose-footer">
          <span className="muted">{newPost.length}/280</span>
          <button className="btn" type="submit" disabled={sendingPost || newPost.length > 280}>
            {sendingPost ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </form>

      <h2 className="section-title">Últimas publicaciones</h2>

      <section className="feed">
        {posts.map((p: any) => {
          const author = pickAuthor(p)
          const authorId = pickUserIdentifier(author)
          const profileHref = authorId ? `/profile/${authorId}` : null

          return (
            <article key={p._id || p.id} className="post-card">
              {profileHref ? (
                <Link href={profileHref} className="avatar-round">{(author?.username?.[0] || 'F').toUpperCase()}</Link>
              ) : (
                <div className="avatar-round">{(author?.username?.[0] || 'F').toUpperCase()}</div>
              )}
              <div>
                <div className="post-author-row">
                  {profileHref ? (
                    <Link href={profileHref} className="post-author">{author?.username || 'Usuario'}</Link>
                  ) : (
                    <span className="post-author">{author?.username || 'Usuario'}</span>
                  )}
                </div>
                <Link href={`/post/${p._id || p.id}`}>
                  <p className="post-text">{pickText(p)}</p>
                </Link>
                <div className="meta-line">
                  <button onClick={() => toggleAction(p._id || p.id, 'like')}>
                    🤍 {p.likes?.length || 0}
                  </button>
                  <button onClick={() => toggleAction(p._id || p.id, 'retweet')}>
                    &#8635; {p.retweets?.length || 0}
                  </button>
                  <Link href={`/post/${p._id || p.id}`} className="meta-btn">
                    💬 {p.comentarios?.length || p.comments?.length || 0}
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      {posts.length === 0 && <p className="muted">No hay posts todavía.</p>}

      <div className="btn-row" style={{ justifyContent: 'center', marginTop: 16 }}>
        {hasPrev && <button className="btn btn-secondary" onClick={() => setPage(Math.max(1, page - 1))}>Anterior</button>}
        <button className="btn" onClick={() => setPage(page + 1)} disabled={!hasNext}>Cargar más</button>
        <span className="muted">Pág. {currentPage}</span>
      </div>
    </>
  )
}