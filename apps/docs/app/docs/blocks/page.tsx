'use client'

import { useState, useEffect } from 'react'
import { componentsApi } from '@/lib/api/components'
import { categoriesApi } from '@/lib/api/categories'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@workspace/ui/components/badge'
import { Card, CardContent } from '@workspace/ui/components/card'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Alert, AlertDescription } from '@workspace/ui/components/alert'
import { Crown, Sparkles, Eye, AlertCircle, Search } from 'lucide-react'
import { Input } from '@workspace/ui/components/input'

interface ComponentWithAccess {
  id: string
  name: string
  slug: string
  description?: string
  previewImageUrl?: string
  categoryId: string
  subcategoryId: string
  isFree: boolean
  isNew: boolean
  isFeatured: boolean
  accessIndicator: {
    type: 'free' | 'premium_accessible' | 'premium_locked'
    label: string
    canAccess: boolean
    icon: string
    upgradeRequired?: boolean
  }
  category?: {
    id: string
    name: string
    slug: string
  }
  subcategory?: {
    id: string
    name: string
    slug: string
  }
}

interface SubcategoryWithComponents {
  id: string
  name: string
  slug: string
  description?: string
  components: ComponentWithAccess[]
}

interface CategoryWithComponents {
  id: string
  name: string
  slug: string
  description?: string
  components: ComponentWithAccess[]
}

export default function AllSectionsPage() {
  const [subcategoriesWithComponents, setSubcategoriesWithComponents] = useState<SubcategoryWithComponents[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSubcategories, setFilteredSubcategories] = useState<SubcategoryWithComponents[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Récupérer toutes les catégories avec leurs sous-catégories
        const categoriesResponse = await categoriesApi.getCategories({
          includeSubcategories: true,
          includeStats: true
        })

        if (!categoriesResponse.success) {
          throw new Error(categoriesResponse.message || 'Erreur lors du chargement des catégories')
        }

        // Récupérer tous les composants avec pagination
        const allComponents: any[] = []
        let currentPage = 1
        let hasMore = true
        const limit = 50 // Limite maximum autorisée par l'API

        while (hasMore) {
          const componentsResponse = await componentsApi.getComponents({
            status: 'published',
            limit,
            page: currentPage
          })

          if (!componentsResponse.success) {
            throw new Error(componentsResponse.message || 'Erreur lors du chargement des composants')
          }

          allComponents.push(...componentsResponse.data.components)
          hasMore = componentsResponse.data.pagination.hasNext
          currentPage++
        }

        // Organiser les composants par sous-catégorie
        const subcategoriesMap = new Map<string, SubcategoryWithComponents>()
        
        // Initialiser les sous-catégories
        categoriesResponse.data.categories.forEach((category: any) => {
          if (category.subcategories) {
            category.subcategories.forEach((subcategory: any) => {
              subcategoriesMap.set(subcategory.id, {
                id: subcategory.id,
                name: subcategory.name,
                slug: subcategory.slug,
                description: subcategory.description,
                components: []
              })
            })
          }
        })

        // Créer un map pour trouver facilement la catégorie d'une sous-catégorie
        const subcategoryToCategoryMap = new Map<string, any>()
        categoriesResponse.data.categories.forEach((category: any) => {
          if (category.subcategories) {
            category.subcategories.forEach((subcategory: any) => {
              subcategoryToCategoryMap.set(subcategory.id, category)
            })
          }
        })

        // Ajouter les composants aux sous-catégories
        allComponents.forEach((component: any) => {
          const subcategory = subcategoriesMap.get(component.subcategoryId)
          const category = subcategoryToCategoryMap.get(component.subcategoryId)
          
          if (subcategory && category) {
            // Transformer le PublicComponent en ComponentWithAccess
            const componentWithAccess: ComponentWithAccess = {
              id: component.id,
              name: component.name,
              slug: component.slug,
              description: component.description,
              previewImageUrl: component.previewImageLarge || component.previewImageSmall,
              categoryId: category.id,
              subcategoryId: component.subcategoryId,
              isFree: component.isFree,
              isNew: component.isNew,
              isFeatured: component.isFeatured,
              accessIndicator: {
                type: component.isFree ? 'free' : (component.canAccess ? 'premium_accessible' : 'premium_locked'),
                label: component.isFree ? 'Gratuit' : (component.canAccess ? 'Premium accessible' : 'Premium verrouillé'),
                canAccess: component.canAccess || component.isFree,
                icon: component.isFree ? '🆓' : (component.canAccess ? '✅' : '🔒'),
                upgradeRequired: !component.isFree && !component.canAccess
              },
              category: {
                id: category.id,
                name: category.name,
                slug: category.slug
              },
              subcategory: {
                id: subcategory.id,
                name: subcategory.name,
                slug: subcategory.slug
              }
            }
            subcategory.components.push(componentWithAccess)
          }
        })

        // Convertir en array et filtrer les sous-catégories vides
        const subcategoriesArray = Array.from(subcategoriesMap.values())
          .filter(subcategory => subcategory.components.length > 0)
          .sort((a, b) => a.name.localeCompare(b.name))

        setSubcategoriesWithComponents(subcategoriesArray)
        setFilteredSubcategories(subcategoriesArray)
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err)
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtrage par recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSubcategories(subcategoriesWithComponents)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = subcategoriesWithComponents.map(subcategory => ({
      ...subcategory,
      components: subcategory.components.filter(component =>
        component.name.toLowerCase().includes(query) ||
        component.description?.toLowerCase().includes(query) ||
        subcategory.name.toLowerCase().includes(query)
      )
    })).filter(subcategory => subcategory.components.length > 0)

    setFilteredSubcategories(filtered)
  }, [searchQuery, subcategoriesWithComponents])

  const getAccessIcon = (accessIndicator: ComponentWithAccess['accessIndicator']) => {
    switch (accessIndicator.icon) {
      case 'free':
        return <Sparkles className="w-3 h-3" />
      case 'premium':
        return <Crown className="w-3 h-3" />
      case 'lock':
        return <Crown className="w-3 h-3" />
      default:
        return <Eye className="w-3 h-3" />
    }
  }

  const getAccessBadgeColor = (accessIndicator: ComponentWithAccess['accessIndicator']) => {
    switch (accessIndicator.type) {
      case 'free':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'premium_accessible':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'premium_locked':
        return 'bg-slate-100 text-slate-600 border-slate-200'
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F7F5] via-[#F1F0EE] to-[#EFEDE8]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-6 w-96 mb-6" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
          
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-12">
              <Skeleton className="h-8 w-48 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((j) => (
                  <Card key={j} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F7F5] via-[#F1F0EE] to-[#EFEDE8]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Alert className="max-w-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const totalComponents = subcategoriesWithComponents.reduce((acc, subcat) => acc + subcat.components.length, 0)
  const freeComponents = subcategoriesWithComponents.reduce((acc, subcat) => 
    acc + subcat.components.filter(comp => comp.isFree).length, 0
  )

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            All Components
          </h1>
          <p className="text-base md:text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
            {totalComponents} sections ready to copy-paste. 
            <span className="text-slate-900 font-medium"> {freeComponents} free to start.</span>
          </p>
          
          {/* Barre de recherche */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-4 text-lg bg-white/80 backdrop-blur-sm border-2 border-slate-200/60 rounded-2xl shadow-lg focus:border-[#C96342] focus:ring-2 focus:ring-[#C96342]/20"
            />
          </div>
        </div>

        {/* Résultats de recherche */}
        {searchQuery && (
          <div className="mb-6">
            <p className="text-sm text-slate-600">
              {filteredSubcategories.reduce((acc, subcat) => acc + subcat.components.length, 0)} résultat(s) 
              pour "{searchQuery}"
            </p>
          </div>
        )}

        {/* Tous les composants ensemble */}
        {filteredSubcategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">
              {searchQuery ? 'Aucune section trouvée pour cette recherche.' : 'Aucune section disponible.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSubcategories.flatMap((subcategory) => 
              subcategory.components.map((component, componentIndex) => (
                <Link
                  key={component.id}
                  href={`/docs/components/category/${component.category?.slug}/${component.subcategory?.slug}#component-${componentIndex + 1}`}
                  className="group"
                >
                  <Card className="overflow-hidden bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg relative">
                    <div className="absolute inset-1 border border-gray-300 rounded-md pointer-events-none"></div>
                    {/* Preview Image */}
                    <div className="aspect-[3/2] bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
                      {component.previewImageUrl ? (
                        <Image
                          src={component.previewImageUrl}
                          alt={component.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <Eye className="w-8 h-8 text-slate-400" />
                          </div>
                        </div>
                      )}
                      
                      {/* Badge section + Status indicators */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                        <div className="px-3 py-1.5 bg-[#C96342] text-white text-sm font-semibold rounded-lg shadow-md border border-[#B55638]">
                          {subcategory.name}
                        </div>
                        
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <h3 className="font-semibold text-slate-900 group-hover:text-[#C96342] text-base leading-tight">
                        {component.name}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}