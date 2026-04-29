import Link from 'next/link'
import './styles.css'

type LinkType = {
  name: string
  link: string
}

const enlaces: LinkType[] = [
  { name: 'El hogar', link: '/' },
  { name: 'Mi perfil', link: '/profile/me' },
  { name: 'Login', link: '/auth' },
  { name: 'Debug', link: '/debug' }
]

const NavigatorPages = () => {
  return (
    <div className="NavigatorContainer">
      {enlaces.map((e) => (
        <Link className="NavigatorLink" key={e.link} href={e.link}>
          {e.name}
        </Link>
      ))}
    </div>
  )
}

export default NavigatorPages