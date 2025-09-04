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

        // Ajouter les composants aux sous-catégories
        allComponents.forEach((component: any) => {
          const subcategory = subcategoriesMap.get(component.subcategoryId)
          if (subcategory) {
            // Transformer le PublicComponent en ComponentWithAccess
            const componentWithAccess: ComponentWithAccess = {
              id: component.id,
              name: component.name,
              slug: component.slug,
              description: component.description,
              previewImageUrl: component.previewImageLarge || component.previewImageSmall,
              categoryId: component.subcategory?.category?.id || '',
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
              category: component.subcategory?.category ? {
                id: component.subcategory.category.id,
                name: component.subcategory.category.name,
                slug: component.subcategory.category.slug
              } : undefined,
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
      <div className="min-h-screen bg-[#F1F0EE]">
        <div className="max-w-7xl mx-auto px-6 py-8">
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
      <div className="min-h-screen bg-[#F1F0EE]">
        <div className="max-w-7xl mx-auto px-6 py-8">
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
    <div className="min-h-screen bg-[#F1F0EE]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Tous les Sections
          </h1>
          <p className="text-xl text-slate-600 mb-6">
            Découvrez notre collection complète de {totalComponents} sections UI premium, 
            dont {freeComponents} gratuites, organisées par type.
          </p>
          
          {/* Barre de recherche */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-2 border-dashed border-slate-200 focus:border-[#C96342] focus:ring-[#C96342]"
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

        {/* Sous-catégories et composants */}
        {filteredSubcategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">
              {searchQuery ? 'Aucune section trouvée pour cette recherche.' : 'Aucune section disponible.'}
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {filteredSubcategories.map((subcategory) => (
              <section key={subcategory.id} className="space-y-6">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {subcategory.name}
                  </h2>
                  {subcategory.description && (
                    <p className="text-slate-600 text-base max-w-3xl mx-auto line-clamp-1">
                      {subcategory.description}
                    </p>
                  )}
                  <div className="mt-3">
                    <Badge variant="outline" className="text-slate-500 border-dashed border-slate-300">
                      {subcategory.components.length} composant{subcategory.components.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {subcategory.components.map((component) => (
                    <Link
                      key={component.id}
                      href={`/docs/components/${component.slug}`}
                      className="group"
                    >
                      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 bg-white border-2 border-dashed border-slate-200 hover:border-slate-300 shadow-sm">
                        {/* Preview Image */}
                        <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden rounded-t-xl">
                          {component.previewImageUrl ? (
                            <Image
                              src={component.previewImageUrl}
                              alt={component.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Eye className="w-6 h-6 text-slate-400" />
                              </div>
                            </div>
                          )}
                          
                          {/* Badges overlay - minimaliste */}
                          {(component.isNew || component.isFeatured) && (
                            <div className="absolute top-3 right-3 flex gap-1">
                              {component.isNew && (
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              )}
                              {component.isFeatured && (
                                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                              )}
                            </div>
                          )}
                        </div>

                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="font-medium text-slate-900 group-hover:text-slate-700 transition-colors leading-tight">
                              {component.name}
                            </h3>
                            {component.isFree && (
                              <Badge variant="secondary" className="bg-green-50 text-green-700 border-0 text-xs px-2 py-0.5 font-medium">
                                Gratuit
                              </Badge>
                            )}
                          </div>
                          {component.description && (
                            <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4">
                              {component.description}
                            </p>
                          )}
                          
                          {/* Tech Stack Badges */}
                          <div className="flex gap-2 mt-auto">
                            <Badge variant="outline" className="text-xs px-2 py-0.5 border-dashed border-blue-200 text-blue-700 bg-blue-50">
                              React
                            </Badge>
                            <Badge variant="outline" className="text-xs px-2 py-0.5 border-dashed border-cyan-200 text-cyan-700 bg-cyan-50">
                              Tailwind
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}