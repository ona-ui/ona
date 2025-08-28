'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { useCategories } from '@/hooks/use-categories'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb'

interface BreadcrumbItemData {
  name: string
  href: string
  icon?: React.ComponentType<any>
}

interface BreadcrumbsProps {
  category?: string
  subcategory?: string
  componentName?: string
}

export function Breadcrumbs({ category, subcategory, componentName }: BreadcrumbsProps) {
  const { data: categoriesData } = useCategories()
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || [])

  const getCategoryName = (slug: string) => {
    const cat = categories.find((c: any) => c.slug === slug)
    return cat?.name || slug
  }

  const getSubcategoryName = (categorySlug: string, subcategorySlug: string) => {
    const cat = categories.find(c => c.slug === categorySlug)
    const sub = cat?.subcategories?.find((s: any) => s.slug === subcategorySlug)
    return sub?.name || subcategorySlug
  }

  const breadcrumbs: BreadcrumbItemData[] = [
    { name: 'Documentation', href: '/docs', icon: Home },
  ]

  if (category) {
    breadcrumbs.push({
      name: getCategoryName(category),
      href: `/docs/components/category/${category}`,
    })
  }

  if (category && subcategory) {
    breadcrumbs.push({
      name: getSubcategoryName(category, subcategory),
      href: `/docs/components/category/${category}/${subcategory}`,
    })
  }

  if (componentName) {
    breadcrumbs.push({
      name: componentName,
      href: '#',
    })
  }

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <BreadcrumbItem key={item.href}>
            {item.icon && index === 0 && (
              <item.icon className="w-4 h-4 mr-2" />
            )}
            {index === breadcrumbs.length - 1 ? (
              <BreadcrumbPage>{item.name}</BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.name}</Link>
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}