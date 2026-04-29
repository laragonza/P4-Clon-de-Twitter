import Link from 'next/link'

export default function Header() {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #ddd' }}>
      <div>
        <Link href="/">P4 Twitter</Link>
      </div>
      <nav>
        <Link href="/profile/me" style={{ marginRight: 12 }}>Profile</Link>
        <Link href="/auth">Login</Link>
      </nav>
    </header>
  )
}