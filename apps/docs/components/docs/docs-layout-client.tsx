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
        <div className="flex h-screen pt-40">
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
      
      {/* Sidebar - Desktop - Fixed position */}
      <div className={`hidden md:block fixed left-0 top-32 bottom-0 transition-all duration-300 ease-in-out z-20 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="h-full overflow-y-auto">
          <StaticDocsSidebar
            navigationData={navigationData}
            categories={categories}
            isCollapsed={isCollapsed}
            onToggle={toggle}
          />
        </div>
      </div>

      <div className="flex pt-32" style={{ height: 'calc(100vh - 32px)' }}>

        {/* Mobile sidebar - rendered separately */}
        <div className="md:hidden">
          <StaticDocsSidebar
            navigationData={navigationData}
            categories={categories}
          />
        </div>

        {/* Main content area with rounded container */}
        <main className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:ml-20' : 'md:ml-72'
        }`}>
          {/* Rounded container for content */}
          <div className="rounded-2xl shadow-sm mr-4 mb-4 mt-2 flex-1 flex flex-col bg-[#F1F0EE]">
            <div className="p-6 md:p-8 flex-1 overflow-y-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}