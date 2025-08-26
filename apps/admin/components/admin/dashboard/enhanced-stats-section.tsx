"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@workspace/ui/components/chart"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  EyeIcon,
  DownloadIcon,
  CopyIcon,
  DollarSignIcon,
  UsersIcon,
  ActivityIcon,
} from "lucide-react"

interface GlobalStats {
  totalCategories: number
  activeCategories: number
  totalSubcategories: number
  activeSubcategories: number
  totalComponents: number
  publishedComponents: number
  totalUsers: number
  totalViews: number
  totalDownloads: number
  totalCopies: number
  totalRevenue: number
  avgComponentsPerCategory: number
  avgSubcategoriesPerCategory: number
  topCategories: Array<{
    id: string
    name: string
    slug: string
    componentCount: number
    viewCount: number
    downloadCount: number
    copyCount: number
  }>
  recentActivity: {
    viewsLast7Days: number
    downloadsLast7Days: number
    copiesLast7Days: number
    newUsersLast7Days: number
  }
  chartData: {
    viewsOverTime: Array<{ date: string; views: number }>
    downloadsOverTime: Array<{ date: string; downloads: number }>
    copiesOverTime: Array<{ date: string; copies: number }>
    revenueOverTime: Array<{ date: string; revenue: number }>
  }
}

interface EnhancedStatsSectionProps {
  stats: GlobalStats
  isLoading?: boolean
}

const chartConfig = {
  views: {
    label: "Vues",
    color: "hsl(var(--chart-1))",
  },
  downloads: {
    label: "Téléchargements",
    color: "hsl(var(--chart-2))",
  },
  copies: {
    label: "Copies",
    color: "hsl(var(--chart-3))",
  },
  revenue: {
    label: "Revenus",
    color: "hsl(var(--chart-4))",
  },
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendValue 
}: {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
}) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUpIcon className="h-3 w-3 text-green-600" />
    if (trend === 'down') return <TrendingDownIcon className="h-3 w-3 text-red-600" />
    return null
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600'
    if (trend === 'down') return 'text-red-600'
    return 'text-muted-foreground'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && trendValue !== undefined && (
          <div className="flex items-center mt-1">
            {getTrendIcon()}
            <span className={`text-xs ml-1 ${getTrendColor()}`}>
              {trendValue > 0 ? '+' : ''}{trendValue} cette semaine
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function EnhancedStatsSection({ stats, isLoading }: EnhancedStatsSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Préparer les données pour les graphiques combinés
  const combinedChartData = stats.chartData.viewsOverTime.map((item, index) => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    views: item.views,
    downloads: stats.chartData.downloadsOverTime[index]?.downloads || 0,
    copies: stats.chartData.copiesOverTime[index]?.copies || 0,
    revenue: stats.chartData.revenueOverTime[index]?.revenue || 0,
  }))

  return (
    <div className="space-y-6">
      {/* Statistiques principales avec tendances */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Utilisateurs"
          value={stats.totalUsers}
          description="Utilisateurs enregistrés"
          icon={UsersIcon}
          trend="up"
          trendValue={stats.recentActivity.newUsersLast7Days}
        />
        <StatCard
          title="Vues totales"
          value={stats.totalViews}
          description="Toutes catégories"
          icon={EyeIcon}
          trend="up"
          trendValue={stats.recentActivity.viewsLast7Days}
        />
        <StatCard
          title="Téléchargements"
          value={stats.totalDownloads}
          description="Composants téléchargés"
          icon={DownloadIcon}
          trend="up"
          trendValue={stats.recentActivity.downloadsLast7Days}
        />
        <StatCard
          title="Revenus totaux"
          value={`${(stats.totalRevenue / 100).toFixed(0)}€`}
          description="Licences vendues"
          icon={DollarSignIcon}
          trend="up"
          trendValue={0}
        />
      </div>

      {/* Graphiques d'activité */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Graphique des vues et interactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ActivityIcon className="h-5 w-5" />
              <span>Activité des 30 derniers jours</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={combinedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stackId="1"
                  stroke="var(--color-views)"
                  fill="var(--color-views)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="copies"
                  stackId="1"
                  stroke="var(--color-copies)"
                  fill="var(--color-copies)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Graphique des téléchargements et revenus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSignIcon className="h-5 w-5" />
              <span>Téléchargements & Revenus</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={combinedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="downloads"
                  stroke="var(--color-downloads)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top catégories */}
      <Card>
        <CardHeader>
          <CardTitle>Top Catégories par Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topCategories.slice(0, 5).map((category, index) => (
              <div key={category.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                    <span className="text-sm font-bold text-primary">#{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{category.name}</h4>
                    <p className="text-sm text-muted-foreground">{category.componentCount} composants</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm font-medium">{category.viewCount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">vues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{category.downloadCount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">téléch.</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{category.copyCount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">copies</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métriques de performance */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Moyennes par catégorie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Composants</span>
              <span className="font-medium">{stats.avgComponentsPerCategory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Sous-catégories</span>
              <span className="font-medium">{stats.avgSubcategoriesPerCategory}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taux d'activité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Catégories actives</span>
              <Badge variant="outline">
                {Math.round((stats.activeCategories / stats.totalCategories) * 100)}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Composants publiés</span>
              <Badge variant="outline">
                {Math.round((stats.publishedComponents / stats.totalComponents) * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nouveaux utilisateurs</span>
              <span className="font-medium text-green-600">+{stats.recentActivity.newUsersLast7Days}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Copies cette semaine</span>
              <span className="font-medium text-blue-600">+{stats.recentActivity.copiesLast7Days}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}