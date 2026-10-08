import React, { createContext, useContext, useState, useEffect } from 'react'

export interface RouterContextType {
  pathname: string
  navigate: (to: string) => void
}

const RouterContext = createContext<RouterContextType>({
  pathname: '/',
  navigate: () => {},
})

export function StudioProRouterProvider({
  initialPath = '/',
  children,
}: {
  initialPath?: string
  children: React.ReactNode
}) {
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#/, '')
      if (hash && (hash.startsWith('/') || hash === 'editor' || hash === 'settings' || hash === 'components')) {
        return hash.startsWith('/') ? hash : `/${hash}`
      }
    }
    return initialPath
  })

  const navigate = (to: string) => {
    const clean = to.startsWith('/') ? to : `/${to}`
    setPathname(clean)
    if (typeof window !== 'undefined') {
      window.location.hash = clean
    }
  }

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '')
      if (hash) {
        setPathname(hash.startsWith('/') ? hash : `/${hash}`)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useNavigate() {
  const ctx = useContext(RouterContext)
  return ctx.navigate
}

export function useLocation() {
  const ctx = useContext(RouterContext)
  return { pathname: ctx.pathname }
}

export function NavLink({
  to,
  children,
  className,
  onClick,
  end = false,
  ...props
}: {
  to: string
  children: React.ReactNode | ((props: { isActive: boolean }) => React.ReactNode)
  className?: string | ((props: { isActive: boolean }) => string)
  onClick?: () => void
  end?: boolean
  [key: string]: any
}) {
  const { pathname, navigate } = useContext(RouterContext)
  const target = to.startsWith('/') ? to : `/${to}`
  const isActive = end ? pathname === target : pathname === target || (target !== '/' && pathname.startsWith(target))

  const computedClassName = typeof className === 'function' ? className({ isActive }) : className

  return (
    <a
      href={`#${target}`}
      onClick={(e) => {
        e.preventDefault()
        navigate(target)
        onClick?.()
      }}
      className={computedClassName}
      {...props}
    >
      {typeof children === 'function' ? children({ isActive }) : children}
    </a>
  )
}

export const Link = NavLink;

export function Outlet({ routes }: { routes?: Record<string, React.ReactNode> }) {
  const { pathname } = useContext(RouterContext)
  if (routes && routes[pathname]) {
    return <>{routes[pathname]}</>
  }
  return null
}

