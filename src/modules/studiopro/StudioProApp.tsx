import React from 'react'
import { StudioProRouterProvider, useLocation } from '@/modules/studiopro/lib/router'
import { ErrorBoundary } from '@/modules/studiopro/layout/ErrorBoundary'
import { AppLayout } from '@/modules/studiopro/layout/AppLayout'
import { Dashboard } from '@/modules/studiopro/routes/Dashboard'
import { Editor } from '@/modules/studiopro/routes/Editor'
import { Settings } from '@/modules/studiopro/routes/Settings'
import { Components } from '@/modules/studiopro/routes/Components'
import { Deploy } from '@/modules/studiopro/routes/Deploy'
import { useKeyboardShortcuts } from '@/modules/studiopro/lib/useKeyboardShortcuts'

function StudioProContent() {
  useKeyboardShortcuts()
  const { pathname } = useLocation()

  let activeView: React.ReactNode = <Dashboard />
  if (pathname === '/editor' || pathname.startsWith('/editor')) {
    activeView = <Editor />
  } else if (pathname === '/settings' || pathname.startsWith('/settings')) {
    activeView = <Settings />
  } else if (pathname === '/components' || pathname.startsWith('/components')) {
    activeView = <Components />
  } else if (pathname === '/deploy' || pathname.startsWith('/deploy')) {
    activeView = <Deploy />
  } else {
    activeView = <Dashboard />
  }

  return <AppLayout>{activeView}</AppLayout>
}

export function StudioProApp() {
  return (
    <ErrorBoundary>
      <StudioProRouterProvider initialPath="/">
        <div className="studio-pro-app w-full h-full min-h-screen bg-bg-0 text-text-0 antialiased selection:bg-green selection:text-black">
          <StudioProContent />
        </div>
      </StudioProRouterProvider>
    </ErrorBoundary>
  )
}

export default StudioProApp

