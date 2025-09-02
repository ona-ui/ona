import { StaticDocsSidebar } from '@/components/docs/static-docs-sidebar'
import { Navbar } from '@/components/navbar'
import { ServerApi } from '@/lib/server-api'

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch navigation data server-side
  const navigationData = await ServerApi.getNavigation()
  const { data: categories } = await ServerApi.getCategories({
    includeSubcategories: true
  })

  return (
    <div className="min-h-screen bg-[#F1F0EE] relative">
      {/* Light grid background like hero */}
      <div className="absolute inset-0" style={{
        backgroundSize: '24px 24px'
      }}></div>
      
      <Navbar/>
      <div className="flex h-screen pt-16">
        {/* Sidebar - Fixed container */}
        <div className="hidden md:block w-64 flex-shrink-0 h-full overflow-y-auto">
          <div className="sticky top-0">
            <StaticDocsSidebar
              navigationData={navigationData}
              categories={categories}
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

        {/* Main content - Scrollable */}
        <main className="flex-1 overflow-y-auto h-full">
          <div className="p-4 md:p-4 relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// ISR configuration
export const revalidate = 600 // 10 minutes pour la navigation