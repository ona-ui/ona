'use client'

import { StaticDocsSidebar } from '@/components/docs/static-docs-sidebar'
import { Navbar } from '@/components/navbar'
import { useSidebar } from '@/hooks/use-sidebar'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

interface DocsLayoutClientProps {
  children: React.ReactNode
  navigationData: any
  categories: any[]
}

export function DocsLayoutClient({ children, navigationData, categories }: DocsLayoutClientProps) {
  const { isCollapsed, isLoaded, toggle } = useSidebar()

  // Éviter le flash pendant le chargement de l'état localStorage
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#F1F0EE] relative">
        <div className="absolute inset-0" style={{ backgroundSize: '24px 24px' }}></div>
        <Navbar />
        <div className="flex h-screen pt-28">
          <div className="hidden md:block w-64 flex-shrink-0 h-full overflow-y-auto">
            <div className="sticky top-0">
              <StaticDocsSidebar
                navigationData={navigationData}
                categories={categories}
              />
            </div>
          </div>
          <main className="flex-1 overflow-y-auto h-full">
            <div className="p-4 md:p-4 relative">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F1F0EE] relative">
      {/* Light grid background like hero */}
      <div className="absolute inset-0" style={{
        backgroundSize: '24px 24px'
      }}></div>
      
      <Navbar />
      
      <div className="flex h-screen pt-28">
        {/* Sidebar - Desktop */}
        <div className={`hidden md:block flex-shrink-0 h-full overflow-y-auto transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}>
          <div className="sticky top-0">
            <StaticDocsSidebar
              navigationData={navigationData}
              categories={categories}
              isCollapsed={isCollapsed}
              onToggle={toggle}
            />
          </div>
        </div>

        {/* Mobile sidebar - rendered separately */}
        <div className="md:hidden">
          <StaticDocsSidebar
            navigationData={navigationData}
            categories={categories}
          />
        </div>

        {/* Main content area with rounded container */}
        <main className={`flex-1 overflow-y-auto h-full transition-all duration-300 ease-in-out ${
          isCollapsed ? 'ml-4' : 'ml-6'
        }`}>
          {/* Toggle button - Desktop only */}
          <button
            onClick={toggle}
            className="hidden md:flex items-center justify-center w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 mb-4 ml-2 mt-2 text-slate-600 hover:text-slate-900"
            title={isCollapsed ? 'Étendre la sidebar' : 'Réduire la sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {/* Rounded container for content */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 mr-4 mb-4 min-h-[calc(100vh-8rem)] overflow-hidden">
            <div className="p-6 md:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}