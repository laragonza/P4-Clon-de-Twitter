"use client"
import { useState, type FormEvent } from 'react'
import api from '@/api/api'

export default function NewPost() {
  const [text, setText] = useState('')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!text) return
    try {
      await api.post('/posts', { contenido: text })
      setText('')
      window.location.reload()
    } catch {
      alert('Error creating post')
    }
  }

  return (
    <form onSubmit={submit} style={{ marginBottom: 12 }}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} style={{ width: '100%' }} />
      <button type="submit" style={{ marginTop: 6 }}>Publicar</button>
    </form>
  )
}