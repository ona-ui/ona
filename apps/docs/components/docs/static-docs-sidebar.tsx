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
  const pathname = usePathname() || ''

  // Smart auto-expand: only expand active category and when searching
  useEffect(() => {
    if (categories.length === 0) return
    
    const validCategories = categories.filter((category: Category) => {
      if (!category.subcategories || category.subcategories.length === 0) return false
      return category.subcategories.some((sub: Subcategory) => (sub.componentsCount || 0) > 0)
    })
    
    // If searching, expand categories that have matches
    if (searchTerm) {
      const matchingCategories = validCategories.filter(category => {
        const categoryMatch = category.name.toLowerCase().includes(searchTerm.toLowerCase())
        const subcategoryMatch = category.subcategories?.some((sub: Subcategory) => 
          sub.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        return categoryMatch || subcategoryMatch
      }).map(cat => cat.id)
      
      setExpandedCategories(new Set(matchingCategories))
      return
    }
    
    // Find active category based on current path
    const activeCategory = validCategories.find(cat => 
      cat.subcategories?.some((sub: Subcategory) => 
        pathname.includes(`/category/${cat.slug}/${sub.slug}`)
      )
    )
    
    if (activeCategory) {
      setExpandedCategories(new Set([activeCategory.id]))
    } else {


      // No active category, expand first category if none are expanded
      if (expandedCategories.size === 0 && validCategories.length > 0) {
        const firstCategoryId = validCategories[0]?.id
        if (firstCategoryId) {
          setExpandedCategories(new Set([firstCategoryId]))
        }
      }
    }
  }, [categories, pathname, searchTerm])

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
    
    return filteredCategories.filter(category => {
      // Search in category name
      const categoryMatch = category.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Search in subcategory names
      const subcategoryMatch = category.subcategories?.some((sub: Subcategory) => 
        sub.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      
      return categoryMatch || subcategoryMatch
    }).map(category => ({
      ...category,
      subcategories: category.subcategories?.filter((sub: Subcategory) => 
        // Show all subcategories if category matches, or only matching subcategories
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        sub.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
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

          {/* Search */}
          {!isCollapsed && (
            <div className="px-4 py-3 border-t border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search components..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:border-[#C96342] focus:ring-2 focus:ring-[#C96342]/20 outline-none transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchTerm('')
                      e.currentTarget.blur()
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Component Categories */}
          <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-3 ${!isCollapsed && 'border-t border-slate-200'} transition-all duration-300`}>
            {/* All Components Link */}
            <div className="relative group mb-4">
              <Link
                href="/docs/blocks"
                className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 p-2'} rounded-md transition-colors ${
                  pathname === '/docs/blocks'
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Grid className="w-4 h-4" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">
                    All Components
                  </span>
                )}
              </Link>
              {/* Tooltip pour mode collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  All Components
                </div>
              )}
            </div>

            <div className="space-y-1">
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
                          <div className="ml-4 mt-1 mb-2 space-y-1 pl-3 border-l border-slate-200/50">
                            {category.subcategories?.filter((sub: Subcategory) => (sub.componentsCount || 0) > 0).map((subcategory: Subcategory) => {
                              const subcategoryPath = `/docs/components/category/${category.slug}/${subcategory.slug}`
                              const isActive = pathname === subcategoryPath
                              return (
                                <Link
                                  key={subcategory.id}
                                  href={subcategoryPath}
                                  className={`relative flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                                    isActive
                                      ? 'bg-slate-100 text-slate-900 font-medium'
                                      : 'text-slate-700 hover:bg-white/80 hover:text-slate-900'
                                  }`}
                                >
                                  <span>{subcategory.name}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                                    isActive 
                                      ? 'bg-slate-200 text-slate-700' 
                                      : 'text-slate-500 bg-slate-100'
                                  }`}>
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

          {/* Discord CTA - Compact */}
          {!isCollapsed && (
            <div className="px-4 pb-4">
              <a
                href="https://discord.gg/XzsMz8BjbV"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full text-xs text-slate-600 hover:text-[#C96342] px-3 py-2 rounded-lg hover:bg-white/60 transition-colors group"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
                </svg>
                <span>Join our Discord</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}