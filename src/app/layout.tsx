import './globals.css'
import Link from 'next/link'
import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'P4 Twitter Clone'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <div className="header-inner">
              <Link href="/" className="brand">
                <span className="brand-word">Nebrija</span>
                <span className="brand-accent">Social</span>
              </Link>

              <nav className="header-nav">
                <Link href="/" className="nav-icon" aria-label="Inicio">⌂</Link>
                <Link href="/profile/me" className="nav-user" aria-label="Mi perfil">L</Link>
                <Link href="/auth" className="nav-icon" aria-label="Ir a login">⇥</Link>
              </nav>
            </div>
          </header>

          <main className="app-content">{children}</main>
        </div>
        <Script
          id="unhandled-rejection-handler"
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function (e) {
                console.error('UnhandledRejection caught by global handler:', e.reason);
              });
            `
          }}
        />
      </body>
    </html>
  )
}
