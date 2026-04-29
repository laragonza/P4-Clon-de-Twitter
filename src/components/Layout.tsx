import Link from 'next/link'
import type { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <header style={{ background: '#111', color: '#fff', padding: 12 }}>
        <Link href="/"><strong>p4-twitter</strong></Link>
        <span style={{ float: 'right' }}>
          <Link href="https://frontend-p4.app/login">Login</Link>
        </span>
      </header>
      <main>{children}</main>
    </div>
  )
}