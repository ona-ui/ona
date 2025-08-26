import { notFound } from 'next/navigation'
import { ServerApi, getAllSubcategorySlugs } from '@/lib/server-api'
import { StaticSubcategoryPage } from '@/components/docs/static-subcategory-page'

interface SubcategoryPageProps {
  params: Promise<{
    categorySlug: string
    subcategorySlug: string
  }>
}

// Generate static params for all subcategories
export async function generateStaticParams() {
  try {
    const slugs = await getAllSubcategorySlugs()
    return slugs.map(({ categorySlug, subcategorySlug }) => ({
      categorySlug,
      subcategorySlug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export default async function SubcategoryPage({ params }: SubcategoryPageProps) {
  try {
    // Await params before using them
    const resolvedParams = await params
    
    // Fetch categories to find the current one
    const { data: categories } = await ServerApi.getCategories({
      includeSubcategories: true
    })
    
    const category = categories.find((cat: any) => cat.slug === resolvedParams.categorySlug)
    const subcategory = category?.subcategories?.find((sub: any) => sub.slug === resolvedParams.subcategorySlug)
    
    if (!category || !subcategory) {
      notFound()
    }
    
    // Fetch components for this subcategory
    const { data: components } = await ServerApi.getComponents({
      subcategoryId: subcategory.id,
      status: 'published',
      includeVersions: true
    })
    
    return (
      <StaticSubcategoryPage
        category={category}
        subcategory={subcategory}
        components={components}
        params={resolvedParams}
      />
    )
  } catch (error) {
    console.error('Error in subcategory page:', error)
    notFound()
  }
}

// ISR configuration
export const revalidate = 10