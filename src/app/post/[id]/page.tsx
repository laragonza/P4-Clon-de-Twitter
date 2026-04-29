"use client"
import useSWR from 'swr'
import { apiFetch, pickAuthor, pickComments, pickText, pickUserIdentifier } from '@/api/api'
import { useState, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type ApiError = Error & { status?: number; data?: any }

// fetcher para SWR igual que en las demás páginas
const fetcher = async (url: string) => {
  const res = await apiFetch<any>(url)
  if (!res.ok) {
    const err = new Error(`API ${res.status}`) as ApiError
    err.status = res.status
    err.data = res.data
    throw err
  }
  return res.data
}

export default function Page() {
  // saco el id del post de la url
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { data, error, mutate } = useSWR<any, ApiError>(id ? `/posts/${id}` : null, fetcher)
  const [comment, setComment] = useState('')

  if (error) {
    return (
      <div>
        <h3>Error loading post</h3>
        <div>Status: {error.status}</div>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(error.data, null, 2)}</pre>
      </div>
    )
  }
  if (!data) return <div>Loading...</div>

  // enviar un comentario nuevo
  async function submitComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!comment.trim()) return

    const res = await apiFetch(`/posts/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify({ contenido: comment })
    })
    if (!res.ok) {
      alert('Error posting comment')
      return
    }
    setComment('')
    // recargo los datos para que aparezca el comentario nuevo
    mutate()
  }

  // para like y retweet uso la misma función con el action como parámetro
  async function toggle(action: string) {
    const res = await apiFetch(`/posts/${id}/${action}`, { method: 'POST' })
    if (!res.ok) {
      alert(`Error en ${action}`)
      return
    }
    mutate()
  }

  // la api puede devolver los comentarios en español o inglés
  const comments = pickComments(data)
  const author = pickAuthor(data)
  const authorId = pickUserIdentifier(author)

  return (
    <section className="profile-shell">
      <Link href="/" className="back-link">Volver</Link>

      <section className="feed">
        <article className="post-card">
          {authorId ? (
            <Link href={`/profile/${authorId}`} className="avatar-round">{(author?.username?.[0] || 'F').toUpperCase()}</Link>
          ) : (
            <div className="avatar-round">{(author?.username?.[0] || 'F').toUpperCase()}</div>
          )}
          <div>
            <div className="post-author-row">
              {authorId ? (
                <Link href={`/profile/${authorId}`} className="post-author">{author?.username || 'Usuario'}</Link>
              ) : (
                <span className="post-author">{author?.username || 'Usuario'}</span>
              )}
            </div>
            <p className="post-text">{pickText(data)}</p>
            <div className="meta-line">
              <button onClick={() => toggle('like')}>
                🤍 {data.likes?.length || 0}
              </button>
              <button onClick={() => toggle('retweet')}>
                &#8635; {data.retweets?.length || 0}
              </button>
              <span>💬 {comments.length}</span>
            </div>
          </div>
        </article>
      </section>

      <section className="comments-wrap">
        <form onSubmit={submitComment} className="compose-wrap" style={{ margin: '16px auto 0', maxWidth: '100%' }}>
          <div className="compose-head">
            <div className="avatar-round">L</div>
            <textarea
              className="textarea"
              placeholder="Escribe tu comentario..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="compose-footer" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" type="submit">Enviar</button>
          </div>
        </form>

        {comments.map((c: any) => {
          const commentAuthor = c.autor || c.author
          const commentAuthorId = pickUserIdentifier(commentAuthor)
          const initial = ((commentAuthor?.username || 'F')[0] || 'F').toUpperCase()
          return (
            <article key={c._id || c.id} className="post-card comment-row">
              {commentAuthorId ? (
                <Link href={`/profile/${commentAuthorId}`} className="avatar-round">{initial}</Link>
              ) : (
                <div className="avatar-round">{initial}</div>
              )}
              <div>
                <div className="post-author-row">
                  {commentAuthorId ? (
                    <Link href={`/profile/${commentAuthorId}`} className="post-author">{commentAuthor?.username || 'Usuario'}</Link>
                  ) : (
                    <span className="post-author">{commentAuthor?.username || 'Usuario'}</span>
                  )}
                </div>
                <p className="post-text">{c.contenido || c.content || ''}</p>
              </div>
            </article>
          )
        })}
      </section>
    </section>
  )
}