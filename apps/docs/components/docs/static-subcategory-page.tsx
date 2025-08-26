'use client'

import { Badge } from '@workspace/ui/components/badge'
import { ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ComponentPreview } from './modern-component-viewer'

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
}

interface Component {
  id: string
  name: string
  slug: string
  description?: string
  isFree: boolean
  isNew: boolean
  isFeatured: boolean
  requiredTier?: string
  viewCount?: number
  copyCount?: number
  versions?: Array<{
    id: string
    framework: string
    codePreview?: string
    codeFull?: string
    versionNumber: string
    cssFramework: string
  }>
}

interface StaticSubcategoryPageProps {
  category: Category
  subcategory: Subcategory
  components: Component[]
  params: {
    categorySlug: string
    subcategorySlug: string
  }
}

export function StaticSubcategoryPage({ 
  category, 
  subcategory, 
  components, 
  params 
}: StaticSubcategoryPageProps) {
  if (components.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF3E0] relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundSize: '24px 24px'
        }}></div>
        
        <div className="relative px-6 py-12">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold text-zinc-800 mb-4">{subcategory.name}</h1>
              <p className="text-lg text-slate-600">No components available at the moment</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF3E0] pt-15 relative overflow-hidden">
      {/* Light grid background like hero */}
      <div className="absolute inset-0" style={{
        backgroundSize: '24px 24px'
      }}></div>
      
      <div className="relative px-6 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumbs with hero-like styling */}
          <div className="mb-6 flex items-center space-x-1 text-sm text-slate-600">
            <Link href="/docs" className="hover:text-zinc-800 transition-colors">Docs</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="hover:text-zinc-800 transition-colors">Components</span>
            <ChevronRight className="w-4 h-4" />
            <span className="hover:text-zinc-800 transition-colors">
              {category.name}
            </span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-zinc-800">{subcategory.name}</span>
          </div>

          {/* Header with hero-like styling */}
          

          {/* Components List */}
          <div className="space-y-1">
            {components.map((component: Component, index: number) => (
              <motion.div
                key={component.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <ComponentPreview component={component} />
              </motion.div>
            ))}
          </div>

          {/* Footer with stats */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="inline-flex items-center gap-1 text-sm text-slate-500">
              <span>✨</span>
              <span>All components are ready to use</span>
              <span>✨</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}