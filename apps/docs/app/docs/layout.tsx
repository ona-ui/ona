import { StaticDocsSidebar } from '@/components/docs/static-docs-sidebar'
import { Navbar } from '@/components/navbar'
import { ServerApi } from '@/lib/server-api'
import { DocsLayoutClient } from '@/components/docs/docs-layout-client'

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
    <DocsLayoutClient
      navigationData={navigationData}
      categories={categories}
    >
      {children}
    </DocsLayoutClient>
  )
}

// ISR configuration
export const revalidate = 600 // 10 minutes pour la navigation