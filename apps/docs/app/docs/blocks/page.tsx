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

interface CategoryWithComponents {
  id: string
  name: string
  slug: string
  description?: string
  components: ComponentWithAccess[]
}

export default function AllSectionsPage() {
  const [categoriesWithComponents, setCategoriesWithComponents] = useState<CategoryWithComponents[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCategories, setFilteredCategories] = useState<CategoryWithComponents[]>([])

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

          allComponents.push(...componentsResponse.data.data)
          hasMore = componentsResponse.data.meta.hasNext
          currentPage++
        }

        // Organiser les composants par catégorie
        const categoriesMap = new Map<string, CategoryWithComponents>()
        
        // Initialiser les catégories
        categoriesResponse.data.forEach(category => {
          categoriesMap.set(category.id, {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            components: []
          })
        })

        // Ajouter les composants aux catégories
        allComponents.forEach(component => {
          const category = categoriesMap.get(component.subcategory.category.id)
          if (category) {
            // Transformer le PublicComponent en ComponentWithAccess
            const componentWithAccess: ComponentWithAccess = {
              id: component.id,
              name: component.name,
              slug: component.slug,
              description: component.description,
              previewImageUrl: component.previewImageLarge || component.previewImageSmall,
              categoryId: component.subcategory.category.id,
              subcategoryId: component.subcategory.id,
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
                id: component.subcategory.category.id,
                name: component.subcategory.category.name,
                slug: component.subcategory.category.slug
              },
              subcategory: {
                id: component.subcategory.id,
                name: component.subcategory.name,
                slug: component.subcategory.slug
              }
            }
            category.components.push(componentWithAccess)
          }
        })

        // Convertir en array et filtrer les catégories vides
        const categoriesArray = Array.from(categoriesMap.values())
          .filter(category => category.components.length > 0)
          .sort((a, b) => a.name.localeCompare(b.name))

        setCategoriesWithComponents(categoriesArray)
        setFilteredCategories(categoriesArray)
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
      setFilteredCategories(categoriesWithComponents)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = categoriesWithComponents.map(category => ({
      ...category,
      components: category.components.filter(component =>
        component.name.toLowerCase().includes(query) ||
        component.description?.toLowerCase().includes(query) ||
        category.name.toLowerCase().includes(query)
      )
    })).filter(category => category.components.length > 0)

    setFilteredCategories(filtered)
  }, [searchQuery, categoriesWithComponents])

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

  const totalComponents = categoriesWithComponents.reduce((acc, cat) => acc + cat.components.length, 0)
  const freeComponents = categoriesWithComponents.reduce((acc, cat) => 
    acc + cat.components.filter(comp => comp.isFree).length, 0
  )

  return (
    <div className="min-h-screen bg-[#F1F0EE]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Tous les Composants
          </h1>
          <p className="text-xl text-slate-600 mb-6">
            Découvrez notre collection complète de {totalComponents} composants UI premium, 
            dont {freeComponents} gratuits, organisés par catégories.
          </p>
          
          {/* Barre de recherche */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Rechercher un composant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200 focus:border-[#C96342] focus:ring-[#C96342]"
            />
          </div>
        </div>

        {/* Résultats de recherche */}
        {searchQuery && (
          <div className="mb-6">
            <p className="text-sm text-slate-600">
              {filteredCategories.reduce((acc, cat) => acc + cat.components.length, 0)} résultat(s) 
              pour "{searchQuery}"
            </p>
          </div>
        )}

        {/* Catégories et composants */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">
              {searchQuery ? 'Aucun composant trouvé pour cette recherche.' : 'Aucun composant disponible.'}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredCategories.map((category) => (
              <section key={category.id} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-slate-600 mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-slate-600">
                    {category.components.length} composant{category.components.length > 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {category.components.map((component) => (
                    <Link
                      key={component.id}
                      href={`/docs/components/category/${component.category?.slug}/${component.subcategory?.slug}`}
                      className="group"
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] bg-white border-slate-200">
                        {/* Preview Image */}
                        <div className="aspect-video bg-slate-100 relative overflow-hidden">
                          {component.previewImageUrl ? (
                            <Image
                              src={component.previewImageUrl}
                              alt={component.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Eye className="w-8 h-8 text-slate-400" />
                            </div>
                          )}
                          
                          {/* Badges overlay */}
                          <div className="absolute top-3 left-3 flex gap-2">
                            <Badge 
                              className={`text-xs ${getAccessBadgeColor(component.accessIndicator)} flex items-center gap-1`}
                            >
                              {getAccessIcon(component.accessIndicator)}
                              {component.accessIndicator.label}
                            </Badge>
                            
                            {component.isNew && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                Nouveau
                              </Badge>
                            )}
                            
                            {component.isFeatured && (
                              <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200/50 text-xs">
                                Populaire
                              </Badge>
                            )}
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <h3 className="font-semibold text-slate-900 group-hover:text-[#C96342] transition-colors">
                            {component.name}
                          </h3>
                          {component.description && (
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {component.description}
                            </p>
                          )}
                          {component.subcategory && (
                            <p className="text-xs text-slate-500 mt-2">
                              {component.subcategory.name}
                            </p>
                          )}
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