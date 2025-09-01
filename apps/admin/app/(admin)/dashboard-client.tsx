"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  FolderIcon,
  ComponentIcon,
  UsersIcon,
  TrendingUpIcon,
  EyeIcon,
  CopyIcon,
  PlusIcon,
  StarIcon,
  CodeIcon,
  BarChart3Icon,
  ActivityIcon
} from "lucide-react"
import {
  useCategories,
  useGlobalCategoriesStats
} from "../../hooks/use-categories"
import {
  useComponents,
  useRecentComponents,
  usePopularComponents
} from "../../hooks/use-components"
import { EnhancedStatsSection } from "../../components/admin/dashboard/enhanced-stats-section"
import Link from "next/link"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  trend?: {
    value: number
    label: string
  }
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-1">
            <TrendingUpIcon className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-600 ml-1">
              +{trend.value}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface RecentActivityItemProps {
  type: 'component' | 'category' | 'user'
  title: string
  description: string
  time: string
  status?: 'published' | 'draft' | 'pending'
}

function RecentActivityItem({ type, title, description, time, status }: RecentActivityItemProps) {
  const getIcon = () => {
    switch (type) {
      case 'component':
        return <ComponentIcon className="h-4 w-4" />
      case 'category':
        return <FolderIcon className="h-4 w-4" />
      case 'user':
        return <UsersIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex items-center space-x-4 p-4 rounded-lg border">
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium truncate">{title}</h3>
          {status && (
            <Badge variant="secondary" className={getStatusColor(status)}>
              {status}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      <div className="flex-shrink-0">
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
    </div>
  )
}

interface QuickActionProps {
  title: string
  description: string
  href: string
  icon: React.ElementType
}

function QuickAction({ title, description, href, icon: Icon }: QuickActionProps) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
        <CardContent className="flex items-center space-x-4 p-6">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <PlusIcon className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  )
}

export default function AdminDashboardClient() {
  // Hooks pour les données principales
  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories({
    includeStats: true,
    limit: 50
  })
  const { data: componentsResponse, isLoading: componentsLoading } = useComponents({
    includeStats: true,
    limit: 50
  })
  
  // Hooks pour les statistiques globales
  const { data: globalCategoriesStats, isLoading: statsLoading } = useGlobalCategoriesStats()
  
  // Hooks pour l'activité récente
  const { data: recentComponentsResponse, isLoading: recentLoading } = useRecentComponents(10)
  const { data: popularComponentsResponse, isLoading: popularLoading } = usePopularComponents(5)

  const isLoading = categoriesLoading || componentsLoading || statsLoading

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Extraction des données réelles avec vérification des types
  // L'API retourne { data: { items: [], pagination: {} } } mais les types indiquent autre chose
  const categories = Array.isArray((categoriesResponse?.data as any)?.items)
    ? (categoriesResponse?.data as any).items
    : Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : []
  
  const components = Array.isArray((componentsResponse?.data as any)?.items)
    ? (componentsResponse?.data as any).items
    : Array.isArray(componentsResponse?.data) ? componentsResponse.data : []
    
  const stats = globalCategoriesStats?.data
  
  const recentComponents = Array.isArray((recentComponentsResponse?.data as any)?.items)
    ? (recentComponentsResponse?.data as any).items
    : Array.isArray(recentComponentsResponse?.data) ? recentComponentsResponse.data : []

  // Calculs des statistiques réelles
  const totalCategories = stats?.totalCategories || categories.length
  const totalComponents = stats?.totalCategories ?
    categories.reduce((acc: number, cat: any) => acc + (cat.componentsCount || cat.componentCount || 0), 0) :
    components.length
  const publishedComponents = components.filter((c: any) => c.status === 'published').length
  const totalViews = components.reduce((acc: number, c: any) => acc + (c.viewCount || 0), 0)
  const totalCopies = components.reduce((acc: number, c: any) => acc + (c.copyCount || 0), 0)

  // Génération de l'activité récente basée sur les vraies données
  const recentActivity: RecentActivityItemProps[] = [
    // Composants récents
    ...recentComponents.slice(0, 3).map((component: any) => ({
      type: 'component' as const,
      title: `Composant "${component.name}"`,
      description: `${component.status === 'published' ? 'Publié' : 'Créé'} dans ${component.subcategory?.category?.name || 'la catégorie'}`,
      time: formatRelativeTime(component.createdAt),
      status: component.status as 'published' | 'draft' | 'pending'
    })),
    // Placeholder pour d'autres activités
    {
      type: 'category',
      title: 'Activité système',
      description: 'Synchronisation des données',
      time: 'Il y a 1h',
      status: 'published'
    }
  ]

  // Fonction pour formater le temps relatif
  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return 'Il y a quelques secondes'
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}m`
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
    return `Il y a ${Math.floor(diff / 86400)}j`
  }

  const quickActions: QuickActionProps[] = [
    {
      title: "Nouveau composant",
      description: "Ajouter un composant à la bibliothèque",
      href: "/admin/components/new",
      icon: ComponentIcon
    },
    {
      title: "Nouvelle catégorie",
      description: "Organiser les composants par catégorie",
      href: "/admin/categories/new",
      icon: FolderIcon
    },
    {
      title: "Gestion utilisateurs",
      description: "Voir et gérer les utilisateurs",
      href: "/admin/users",
      icon: UsersIcon
    }
  ]

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre bibliothèque de composants
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Exporter
          </Button>
          <Button size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            Nouveau composant
          </Button>
        </div>
      </div>

      {/* Statistiques enrichies avec graphiques */}
      {stats ? (
        <EnhancedStatsSection stats={stats} isLoading={statsLoading} />
      ) : (
        /* Fallback vers les anciennes statistiques si les nouvelles ne sont pas disponibles */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Catégories"
            value={totalCategories}
            description="Catégories actives"
            icon={FolderIcon}
            trend={{ value: 10, label: "ce mois" }}
          />
          <StatCard
            title="Total Composants"
            value={totalComponents}
            description={`${publishedComponents} publiés`}
            icon={ComponentIcon}
            trend={{ value: 25, label: "ce mois" }}
          />
          <StatCard
            title="Vues totales"
            value={totalViews.toLocaleString()}
            description="Toutes catégories"
            icon={EyeIcon}
            trend={{ value: 15, label: "ce mois" }}
          />
          <StatCard
            title="Copies totales"
            value={totalCopies.toLocaleString()}
            description="Code téléchargé"
            icon={CopyIcon}
            trend={{ value: 20, label: "ce mois" }}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
        {/* Actions rapides */}
        <div className="col-span-4 space-y-4">
          <div>
            <h3 className="text-lg font-medium">Actions rapides</h3>
            <p className="text-sm text-muted-foreground">
              Créer du nouveau contenu rapidement
            </p>
          </div>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Composants populaires */}
        <div className="col-span-4 space-y-4">
          <div>
            <h3 className="text-lg font-medium">Composants populaires</h3>
            <p className="text-sm text-muted-foreground">
              Les plus consultés cette semaine
            </p>
          </div>
          <div className="space-y-3">
            {components.slice(0, 5).map((component: any, index: number) => (
              <div key={component.id} className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                    <CodeIcon className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium truncate">{component.name}</h4>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center">
                      <EyeIcon className="h-3 w-3 mr-1" />
                      {(component.viewCount || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center">
                      <CopyIcon className="h-3 w-3 mr-1" />
                      {(component.copyCount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {component.isFeatured && (
                    <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activité récente */}
        <div className="col-span-4 space-y-4">
          <div>
            <h3 className="text-lg font-medium">Activité récente</h3>
            <p className="text-sm text-muted-foreground">
              Dernières modifications dans l'admin
            </p>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <RecentActivityItem key={index} {...activity} />
            ))}
          </div>
          <div className="text-center pt-4">
            <Button variant="outline" size="sm">
              Voir toute l'activité
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3Icon className="h-5 w-5" />
              <span>Performance des catégories</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.slice(0, 5).map((category: any) => (
              <div key={category.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FolderIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {category.componentCount || category.subcategoryCount || 0} composants
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ActivityIcon className="h-5 w-5" />
              <span>Versions par framework</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">React</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {components.filter((c: any) => c.versions?.some((v: any) => v.framework === 'react')).length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Vue</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {components.filter((c: any) => c.versions?.some((v: any) => v.framework === 'vue')).length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Svelte</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {components.filter((c: any) => c.versions?.some((v: any) => v.framework === 'svelte')).length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm">HTML</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {components.filter((c: any) => c.versions?.some((v: any) => v.framework === 'html')).length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUpIcon className="h-5 w-5" />
              <span>Taux de conversion</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {components.length > 0
                  ? ((components.reduce((acc: number, c: any) => acc + (c.conversionRate || 0), 0) / components.length) || 0).toFixed(1)
                  : 0
                }%
              </div>
              <p className="text-sm text-muted-foreground">Taux moyen</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Meilleur composant</span>
                <span className="font-medium">
                  {Math.max(...components.map((c: any) => c.conversionRate || 0), 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Composants avec conversion</span>
                <span className="font-medium">
                  {components.filter((c: any) => c.conversionRate && c.conversionRate > 0).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}