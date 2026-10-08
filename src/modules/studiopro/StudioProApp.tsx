import React, { useEffect, useState } from 'react'
import { StudioProRouterProvider, useLocation, useNavigate } from '@/modules/studiopro/lib/router'
import { ErrorBoundary } from '@/modules/studiopro/layout/ErrorBoundary'
import { AppLayout } from '@/modules/studiopro/layout/AppLayout'
import { Dashboard } from '@/modules/studiopro/routes/Dashboard'
import { Editor } from '@/modules/studiopro/routes/Editor'
import { Settings } from '@/modules/studiopro/routes/Settings'
import { Components } from '@/modules/studiopro/routes/Components'
import { Deploy } from '@/modules/studiopro/routes/Deploy'
import { useKeyboardShortcuts } from '@/modules/studiopro/lib/useKeyboardShortcuts'
import { supabase } from '@/integrations/supabase/client'
import { useConfigStore } from '@/modules/studiopro/store/configStore'
import { useEditorStore } from '@/modules/studiopro/store/editorStore'
import { buildStudioProConfigFromLead } from '@/modules/studiopro/lib/buildStudioProConfigFromLead'
import { toast } from 'sonner'
import type { SiteConfig } from '@/modules/studiopro/blocks/types'

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

interface StudioProAppProps {
  pageId?: string
  projectId?: string
}

function PageLoader({ pageId }: { pageId?: string }) {
  const navigate = useNavigate()
  const setConfig = useConfigStore((s) => s.setConfig)
  const setEialinkPage = useEditorStore((s) => s.setEialinkPage)

  useEffect(() => {
    if (!pageId) return

    let isMounted = true
    async function loadPage() {
      try {
        const { data, error } = await supabase
          .from('bio_pages')
          .select('*')
          .eq('id', pageId)
          .single()

        if (error || !data) {
          toast.error('Página não encontrada no EiaLink')
          return
        }

        if (!isMounted) return

        setEialinkPage({
          id: data.id,
          slug: data.slug,
          title: data.title,
        })

        const rawSocial = (data.social_links as Record<string, any>) || {}
        const existingConfig = (rawSocial.studiopro_config || rawSocial.studioproConfig) as SiteConfig | undefined

        if (existingConfig && existingConfig.blocks?.length) {
          setConfig(existingConfig)
        } else {
          // Generate an initial Studio Pro config based on page data
          const generated = buildStudioProConfigFromLead({
            name: data.title,
            niche: rawSocial.niche,
            city: rawSocial.city,
            whatsapp: rawSocial.whatsapp || data.whatsapp,
            address: rawSocial.address,
            rating: rawSocial.google_rating,
            reviews_count: rawSocial.reviews_count,
            instagram: rawSocial.instagram,
            photos: rawSocial.google_photos || rawSocial.instagram_photos || [],
          })
          setConfig(generated)
        }

        navigate('/editor')
        toast.success(`Carregado: ${data.title} (${data.slug}.eialink.com.br)`)
      } catch (err: any) {
        toast.error(err.message || 'Erro ao carregar página')
      }
    }

    void loadPage()
    return () => {
      isMounted = false
    }
  }, [pageId, navigate, setConfig, setEialinkPage])

  return null
}

export function StudioProApp({ pageId, projectId }: StudioProAppProps) {
  // Determine if URL query param has ?page=
  const effectivePageId = pageId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('page') || undefined : undefined)

  return (
    <ErrorBoundary>
      <StudioProRouterProvider initialPath={effectivePageId ? '/editor' : '/'}>
        <PageLoader pageId={effectivePageId} />
        <div className="studio-pro-app w-full h-full min-h-screen bg-bg-0 text-text-0 antialiased selection:bg-green selection:text-black">
          <StudioProContent />
        </div>
      </StudioProRouterProvider>
    </ErrorBoundary>
  )
}

export default StudioProApp
