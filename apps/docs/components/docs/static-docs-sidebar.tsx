'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight, Folder, Search, FileText, Code2, Menu, X } from 'lucide-react'

interface DocsSection {
  title: string
  href: string
  icon: React.ReactNode
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  subcategories?: Subcategory[]
}

interface Subcategory {
  id: string
  name: string
  slug: string
  description?: string
  componentsCount?: number
}

interface StaticDocsSidebarProps {
  navigationData?: any
  categories: Category[]
  isOpen?: boolean
  onToggle?: () => void
}

const docsSections: DocsSection[] = [
  {
    title: 'Introduction',
    href: '/docs',
    icon: <FileText className="w-4 h-4" />
  }
]

export function StaticDocsSidebar({ navigationData, categories = [], isOpen = false, onToggle }: StaticDocsSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile sidebar when pathname changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isMobileOpen && !target.closest('.sidebar-container') && !target.closest('.sidebar-toggle')) {
        setIsMobileOpen(false)
      }
    }

    if (isMobileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileOpen])
  
  // Filtrer les catégories qui ont des composants
  const filteredCategories = categories.filter((category: Category) => {
    if (!category.subcategories || category.subcategories.length === 0) return false
    return category.subcategories.some((sub: Subcategory) => (sub.componentsCount || 0) > 0)
  })

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const filterCategories = () => {
    if (!Array.isArray(filteredCategories)) return []
    if (!searchTerm) return filteredCategories
    return filteredCategories.filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Check if we should skip category level (only one category exists)
  const shouldSkipCategories = filteredCategories.length === 1 && !searchTerm
  const directSubcategories = shouldSkipCategories && filteredCategories[0]?.subcategories ? filteredCategories[0].subcategories : []

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="sidebar-toggle fixed top-20 left-4 z-40 md:hidden p-2 bg-[#FAF3E0]/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm hover:bg-[#FAF3E0] transition-colors"
        aria-label="Toggle sidebar"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden" />
      )}

      {/* Sidebar */}
      <div className={`sidebar-container bg-[#FAF3E0]/80 backdrop-blur-sm border-r border-slate-200 shadow-sm flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'fixed left-0 top-0 h-full z-30 translate-x-0 w-64' : 'fixed left-0 top-0 h-full z-30 -translate-x-full w-64'}
        md:relative md:z-auto md:translate-x-0 md:h-full md:w-full
      `}>
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 md:hidden">
          <h2 className="font-semibold text-slate-800">Documentation</h2>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:transition-colors hover:[&::-webkit-scrollbar-thumb]:bg-slate-300/70" style={{scrollbarWidth: 'thin', scrollbarColor: 'rgba(148, 163, 184, 0.3) transparent'}}>
        {/* Docs Sections */}
        <div className="px-4 py-3">
          <nav className="space-y-1">
            {docsSections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className={`flex items-center gap-2 px-2 py-2 text-sm rounded-lg transition-colors ${
                  pathname === section.href
                    ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 font-medium shadow-sm border border-amber-200/50'
                    : 'text-slate-600 hover:text-zinc-800 hover:bg-slate-50'
                }`}
              >
                {section.icon}
                {section.title}
              </Link>
            ))}
          </nav>
        </div>

        {/* Categories as Section Titles */}
        <div className="px-4 py-3 border-t border-slate-100">
          {shouldSkipCategories ? (
            // Show subcategories under the category name as title
            <div>
              <h3 className="text-sm font-semibold text-zinc-800 mb-3">
                {filteredCategories[0]?.name}
              </h3>
              <nav className="space-y-1">
                {directSubcategories.filter((sub: Subcategory) => (sub.componentsCount || 0) > 0).map((subcategory: Subcategory) => {
                  const subcategoryPath = `/docs/components/category/${filteredCategories[0]?.slug}/${subcategory.slug}`
                  return (
                    <Link
                      key={subcategory.id}
                      href={subcategoryPath}
                      className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all hover:scale-[1.02] ${
                        pathname === subcategoryPath
                          ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 font-medium shadow-sm border border-amber-200/50'
                          : 'text-slate-600 hover:text-zinc-800 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4" />
                        <span className="font-medium">{subcategory.name}</span>
                      </div>
                      <div className="px-2 py-0.5 text-xs text-slate-500 bg-[#FAF3E0]/80 rounded-md shadow-sm">
                        {subcategory.componentsCount || 0}
                      </div>
                    </Link>
                  )
                })}
              </nav>
            </div>
          ) : (
            // Show each category as its own section
            <div className="space-y-6">
              {filterCategories().map((category) => {
                const hasSubcategories = category.subcategories && category.subcategories.length > 0
                
                return (
                  <div key={category.id}>
                    <h3 className="text-sm font-semibold text-zinc-800 mb-3">
                      {category.name}
                    </h3>
                    
                    {hasSubcategories && (
                      <nav className="space-y-1">
                        {category.subcategories?.filter((sub: Subcategory) => (sub.componentsCount || 0) > 0).map((subcategory: Subcategory) => {
                          const subcategoryPath = `/docs/components/category/${category.slug}/${subcategory.slug}`
                          return (
                            <Link
                              key={subcategory.id}
                              href={subcategoryPath}
                              className={`flex items-center justify-between px-2 py-1 text-sm rounded-sm transition-all hover:scale-[1.02] ${
                                pathname === subcategoryPath
                                  ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 font-medium shadow-sm border border-amber-200/50'
                                  : 'text-slate-600 hover:text-zinc-800 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                              }`}
                            >
                              <span className="font-medium">{subcategory.name}</span>
                              <div className="px-2 py-0.5 text-xs text-slate-500 bg-[#FAF3E0]/80 rounded-md shadow-sm">
                                {subcategory.componentsCount || 0}
                              </div>
                            </Link>
                          )
                        })}
                      </nav>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}