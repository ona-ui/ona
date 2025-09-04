'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight, Folder, Search, FileText, Code2, Menu, X, Grid, Tag, Crown, PanelLeftOpen, PanelLeftClose } from 'lucide-react'

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
  isCollapsed?: boolean
}

const docsSections: DocsSection[] = [
  {
    title: 'Introduction',
    href: '/docs',
    icon: <FileText className="w-4 h-4" />
  }
]

export function StaticDocsSidebar({ navigationData, categories = [], isOpen = false, onToggle, isCollapsed = false }: StaticDocsSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['all']))
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  // Auto-expand all categories on mount
  useEffect(() => {
    if (categories.length > 0) {
      const allCategoryIds = categories.map(cat => cat.id)
      setExpandedCategories(new Set(allCategoryIds))
    }
  }, [categories])

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

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
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
      {/* Mobile Toggle Button - Only show when sidebar is closed */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="sidebar-toggle fixed top-16 left-4 z-50 md:hidden p-2 bg-[#F1F0EE]/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm hover:bg-[#F1F0EE] transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden" />
      )}

      {/* Sidebar */}
      <div className={`sidebar-container bg-[#F1F0EE] flex flex-col transition-all duration-300 ease-in-out
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

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200/50 hover:scrollbar-thumb-slate-300/70">
          {/* Toggle button - subtle arrows */}
          {onToggle && (
            <button
              onClick={onToggle}
              className={`absolute top-4 ${isCollapsed ? 'right-0 -mr-3' : 'right-4'} flex items-center justify-center w-6 h-6 text-slate-400 hover:text-slate-600 transition-all duration-200 hover:bg-slate-100/60 rounded group z-10`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <div className="flex">
                <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} />
                <ChevronRight className={`w-3 h-3 -ml-1 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} />
              </div>
              {/* Tooltip pour mode collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Expand
                </div>
              )}
            </button>
          )}

          {/* Docs Sections */}
          <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-3 transition-all duration-300`}>
            <nav className="space-y-1">
              {docsSections.map((section) => (
                <div key={section.href} className="relative group">
                  <Link
                    href={section.href}
                    className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-2 py-2'} text-sm rounded-md transition-colors ${
                      pathname === section.href
                        ? 'bg-slate-100 text-slate-900 font-medium'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {section.icon}
                    {!isCollapsed && section.title}
                  </Link>
                  {/* Tooltip pour mode collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {section.title}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Component Sections */}
          <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-3 border-t border-slate-200 transition-all duration-300`}>
            <div className="space-y-4">
              {/* All Sections - Always visible */}
              <div>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} mb-4 cursor-pointer hover:opacity-70 transition-opacity`}>
                  <Grid className="w-4 h-4 text-slate-600" />
                  {!isCollapsed && <span className="text-base font-semibold" style={{color: '#161616'}}>All Sections</span>}
                </div>
                
                <div className={`${isCollapsed ? '' : 'ml-2'} space-y-1`}>
                  {filterCategories().map((category) => {
                    const hasSubcategories = category.subcategories && category.subcategories.length > 0
                    const isExpanded = expandedCategories.has(category.id)
                    
                    if (isCollapsed) {
                      // Mode collapsed : afficher seulement les icônes des catégories
                      return (
                        <div key={category.id} className="relative group">
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className={`flex items-center justify-center w-full p-2 rounded-md transition-all ${
                              isExpanded
                                ? 'bg-slate-50/60'
                                : 'hover:bg-white/80'
                            }`}
                          >
                            <Folder className="w-4 h-4 text-slate-600" />
                          </button>
                          {/* Tooltip avec sous-catégories */}
                          <div className="absolute left-full ml-2 top-0 bg-slate-800 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 max-w-xs">
                            <div className="font-medium mb-1">{category.name}</div>
                            {hasSubcategories && (
                              <div className="space-y-1 text-slate-300">
                                {category.subcategories?.filter((sub: Subcategory) => (sub.componentsCount || 0) > 0).slice(0, 3).map((subcategory: Subcategory) => (
                                  <div key={subcategory.id} className="text-xs">
                                    {subcategory.name} ({subcategory.componentsCount || 0})
                                  </div>
                                ))}
                                {category.subcategories && category.subcategories.length > 3 && (
                                  <div className="text-xs text-slate-400">+{category.subcategories.length - 3} more...</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    }
                    
                    return (
                      <div key={category.id}>
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className={`flex items-center justify-between w-full text-left rounded-md p-2 transition-all ${
                            isExpanded
                              ? 'bg-slate-50/60'
                              : 'hover:bg-white/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base font-medium" style={{color: '#161616'}}>{category.name}</span>
                          </div>
                          {hasSubcategories && (
                            isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-700" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            )
                          )}
                        </button>
                        
                        {isExpanded && hasSubcategories && (
                          <div className="ml-4 mt-1 mb-2 space-y-1 pl-3">
                            {category.subcategories?.filter((sub: Subcategory) => (sub.componentsCount || 0) > 0).map((subcategory: Subcategory) => {
                              const subcategoryPath = `/docs/components/category/${category.slug}/${subcategory.slug}`
                              return (
                                <Link
                                  key={subcategory.id}
                                  href={subcategoryPath}
                                  className={`flex items-center justify-between px-3 py-2 text-base rounded-md transition-colors ${
                                    pathname === subcategoryPath
                                      ? 'bg-slate-50/60 font-semibold'
                                      : 'text-slate-700 hover:bg-white/60'
                                  }`}
                                  style={{color: pathname === subcategoryPath ? '#161616' : undefined}}
                                >
                                  <span>{subcategory.name}</span>
                                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                    {subcategory.componentsCount || 0}
                                  </span>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Premium CTA - Sticky */}
          <div className="sticky bottom-0 bg-[#F1F0EE] p-4 border-t border-slate-200/50 backdrop-blur-sm">
            {isCollapsed ? (
              <div className="relative group">
                <Link
                  href="/pricing"
                  className="flex items-center justify-center w-full bg-gradient-to-r from-[#C96342] to-[#B55638] hover:from-[#B55638] hover:to-[#A14D2F] text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                >
                  <Crown className="w-4 h-4" />
                </Link>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Get Premium
                </div>
              </div>
            ) : (
              <Link
                href="/pricing"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#C96342] to-[#B55638] hover:from-[#B55638] hover:to-[#A14D2F] text-white text-sm font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
              >
                <Crown className="w-4 h-4" />
                Get Premium
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  )
}