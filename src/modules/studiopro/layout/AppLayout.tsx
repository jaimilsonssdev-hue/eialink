import { Outlet, useLocation } from "@/modules/studiopro/lib/router"
import { TopNav } from './TopNav'
import { Toaster } from 'sonner'
import { ShortcutsModal } from "@/modules/studiopro/editor/ShortcutsModal'

export function AppLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-bg-0 text-text-0">
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <TopNav />
      <main id="main-content" className="flex-1 mt-12 overflow-hidden" role="main">
        <div key={location.pathname} className="h-full animate-fade-in-up">
          {children || <Outlet />}
        </div>
      </main>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--color-bg-3)',
            border: '1px solid var(--color-border-default)',
            color: 'var(--color-text-0)',
            fontSize: '13px',
          },
        }}
      />
      <ShortcutsModal />
    </div>
  )
}
