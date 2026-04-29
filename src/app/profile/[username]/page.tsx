"use client"
import useSWR from 'swr'
import { apiFetch, pickAuthor, pickText, pickUserIdentifier } from '@/api/api'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type ApiError = Error & { status?: number; data?: any }

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

function getFollowersList(profileUser: any) {
  return profileUser?.followers || profileUser?.seguidores || []
}

function isMeFollowingUser(profileUser: any, meId: string | null) {
  if (!profileUser) return false
  if (typeof profileUser?.followingMe === 'boolean') return profileUser.followingMe
  if (typeof profileUser?.siguiendo === 'boolean') return profileUser.siguiendo

  if (!meId) return false
  const followers = getFollowersList(profileUser)
  return followers.some((f: any) => {
    const followerId = typeof f === 'string' ? f : (f?._id || f?.id || f?.username)
    return followerId === meId
  })
}

export default function Page() {
  const { username } = useParams<{ username: string }>()
  const [page, setPage] = useState(1)
  const [followOverride, setFollowOverride] = useState<boolean | null>(null)
  const [followersOverride, setFollowersOverride] = useState<number | null>(null)
  const [followingCountOverride, setFollowingCountOverride] = useState<number | null>(null)
  const [followLoading, setFollowLoading] = useState(false)
  const [followError, setFollowError] = useState('')

  const { data: me, error: meError } = useSWR<any, ApiError>('/users/me', fetcher)
  const meUser = me?.user || me

  const profileTarget = username === 'me'
    ? (meUser?._id || meUser?.id || meUser?.username)
    : username

  const { data, mutate, error: profileError } = useSWR<any, ApiError>(
    profileTarget ? `/users/${profileTarget}/profile?page=${page}` : null,
    fetcher
  )

  const profileUser = data?.user || data || null
  const profileId = pickUserIdentifier(profileUser)
  const meId = pickUserIdentifier(meUser)
  const isOwnProfile = profileId && meId ? profileId === meId : username === 'me'

  useEffect(() => {
    setFollowOverride(null)
    setFollowersOverride(null)
    setFollowingCountOverride(null)
    setFollowError('')
  }, [profileId])

  if (username === 'me' && meError) {
    return (
      <main style={{ padding: 20 }}>
        <h2>No se pudo cargar tu usuario</h2>
        <p>Detalle: {meError.data?.error || meError.message}</p>
      </main>
    )
  }

  if (profileError) {
    return (
      <main style={{ padding: 20 }}>
        <h2>Error cargando perfil</h2>
        <p>Status: {profileError.status || '-'}</p>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(profileError.data, null, 2)}</pre>
      </main>
    )
  }

  if (!data) return <div>Loading...</div>

  const allPosts = data.posts || []
  const serverFollowing = isMeFollowingUser(profileUser, meId)
  const serverFollowersCount = getFollowersList(profileUser).length
  const serverFollowingCount = (profileUser?.seguidos || profileUser?.following || []).length
  const isFollowing = followOverride ?? serverFollowing
  const followersCount = followersOverride ?? serverFollowersCount
  const followingCount = followingCountOverride ?? serverFollowingCount
  const currentPage = data.pagina || page
  const totalPages = data.totalPaginas || 1
  const visiblePosts = data.totalPaginas ? allPosts : allPosts.slice((page - 1) * 10, page * 10)
  const effectiveTotalPages = data.totalPaginas || Math.max(1, Math.ceil(allPosts.length / 10))

  async function toggleFollow() {
    if (!profileUser || followLoading) return

    setFollowError('')

    const targetCandidates = [
      profileId,
      profileUser?.username,
      username
    ].filter((value, index, arr) => Boolean(value) && value !== 'me' && arr.indexOf(value) === index) as string[]

    if (targetCandidates.length === 0) return

    setFollowLoading(true)
    let res: any = null
    for (const candidate of targetCandidates) {
      const attempt = await apiFetch(`/users/${candidate}/follow`, { method: 'POST' })
      if (attempt.ok) {
        res = attempt
        break
      }
      res = attempt
    }
    setFollowLoading(false)

    if (!res?.ok) {
      setFollowError(res?.data?.error || `No se pudo seguir/dejar de seguir (status ${res?.status || '-'})`)
      return
    }

    const followingNow = Boolean(res.data?.siguiendo ?? !isFollowing)

    setFollowOverride(followingNow)
    setFollowersOverride(Math.max(0, serverFollowersCount + (followingNow ? 1 : -1)))

    if (res.data?.user) {
      const loggedInUser = res.data.user
      const loggedInFollowingCount = (loggedInUser.seguidos || loggedInUser.following || []).length
      if (isOwnProfile) {
        setFollowingCountOverride(loggedInFollowingCount)
      }
    }

    mutate((current: any) => {
      if (!current) return current

      const currentProfileUser = current.user || current
      const prevFollowers = getFollowersList(currentProfileUser)
      const alreadyFollowing = isMeFollowingUser(currentProfileUser, meId)

      let nextFollowers = prevFollowers
      if (meId) {
        if (followingNow && !alreadyFollowing) {
          nextFollowers = [...prevFollowers, meId]
        } else if (!followingNow && alreadyFollowing) {
          nextFollowers = prevFollowers.filter((f: any) => {
            const followerId = typeof f === 'string' ? f : pickUserIdentifier(f)
            return followerId !== meId
          })
        }
      }

      const nextProfileUser = {
        ...currentProfileUser,
        siguiendo: followingNow,
        followingMe: followingNow,
        followers: nextFollowers
      }

      if (current.user) {
        return { ...current, user: nextProfileUser }
      }
      return nextProfileUser
    }, false)
  }

  async function togglePost(postId: string, action: string) {
    const res = await apiFetch(`/posts/${postId}/${action}`, { method: 'POST' })
    if (!res.ok) {
      alert(`Error en ${action}`)
      return
    }
    mutate()
  }

  return (
    <section className="profile-shell">
      <Link href="/" className="back-link">Volver</Link>

      <article className="profile-card">
        <div className="profile-cover" />
        <div className="profile-content">
          <div className="profile-left">
            <div className="profile-big-avatar">{(profileUser?.username?.[0] || 'F').toUpperCase()}</div>
            <div>
              <h1 className="profile-name">{profileUser?.username || 'Perfil'}</h1>
              <div className="profile-stats">
                <span><strong>{followersCount}</strong> seguidores</span>
                <span><strong>{followingCount}</strong> seguidos</span>
              </div>
              {profileUser?.bio && <p className="muted" style={{ margin: '6px 0 0' }}>{profileUser.bio}</p>}
            </div>
          </div>

          {!isOwnProfile && (
            <button className="btn" onClick={toggleFollow} disabled={followLoading}>
              {followLoading ? 'Actualizando...' : isFollowing ? 'Dejar de seguir' : 'Seguir'}
            </button>
          )}
        </div>
        {followError && (
          <p className="error-text" style={{ margin: '0 16px 14px' }}>{followError}</p>
        )}
      </article>

      <h2 className="section-title">Publicaciones ({allPosts.length})</h2>

      <section className="feed">
        {visiblePosts.map((p: any) => (
          <article key={p._id || p.id} className="post-card">
            <div className="avatar-round">{(pickAuthor(p)?.username?.[0] || profileUser?.username?.[0] || 'F').toUpperCase()}</div>
            <div>
              <div className="post-author-row">
                <span className="post-author">{pickAuthor(p)?.username || profileUser?.username || 'Usuario'}</span>
              </div>
              <Link href={`/post/${p._id || p.id}`}><p className="post-text">{pickText(p)}</p></Link>
              <div className="meta-line">
                <button onClick={() => togglePost(p._id || p.id, 'like')}>
                  🤍 {p.likes?.length || 0}
                </button>
                <button onClick={() => togglePost(p._id || p.id, 'retweet')}>
                  &#8635; {p.retweets?.length || 0}
                </button>
                <Link href={`/post/${p._id || p.id}`} className="meta-btn">
                  💬 {p.comentarios?.length || p.comments?.length || 0}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      {visiblePosts.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>Sin publicaciones aún</p>}

      <div className="btn-row" style={{ justifyContent: 'center', marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>Anterior</button>
        <button className="btn" onClick={() => setPage(page + 1)} disabled={page >= effectiveTotalPages || page >= totalPages}>Cargar más</button>
        <span className="muted">Pág. {currentPage}</span>
      </div>
    </section>
  )
}