import Link from 'next/link'

type PostLike = {
  _id?: string
  id?: string
  contenido?: string
  content?: string
  autor?: { username?: string }
  author?: { username?: string }
  user?: { username?: string }
  createdAt?: string
  likes?: unknown[]
  retweets?: unknown[]
}

export default function PostItem({ post }: { post: PostLike }) {
  const id = post._id || post.id
  const text = post.contenido || post.content || 'Untitled'
  const username = post.autor?.username || post.author?.username || post.user?.username || 'unknown'

  return (
    <article style={{ border: '1px solid #eee', padding: 12, marginBottom: 8 }}>
      <Link href={`/post/${id}`}><h3>{text.slice(0, 80)}</h3></Link>
      <div>By {username} - {post.createdAt ? new Date(post.createdAt).toLocaleString() : '-'}</div>
      <div style={{ marginTop: 8 }}>
        <button style={{ marginRight: 8 }}>🤍 {post.likes?.length || 0}</button>
        <button>� {post.retweets?.length || 0}</button>
      </div>
    </article>
  )
}