"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import {
  User,
  Crown,
  Key,
  Download,
  Settings,
  LogOut,
  Loader2,
  Shield
} from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { LicenseCard } from '@/components/dashboard/license-card'
import { UserProfile } from '@/components/dashboard/user-profile'
import { UserStats } from '@/components/dashboard/user-stats'

// Note: Utilisation d'une notification simple en attendant la configuration du toast
const toast = (options: { title: string; description: string; variant?: string }) => {
  alert(`${options.title}: ${options.description}`)
}
interface DashboardData {
  user: {
    id: string
    email: string
    name: string
    username?: string
    role: string
    emailVerified: boolean
    image?: string
    bio?: string
    website?: string
    company?: string
    location?: string
    twitterHandle?: string
    githubUsername?: string
    preferredFramework: string
    preferredCss: string
    darkModeDefault: boolean
    lastLoginAt?: string
    createdAt: string
    updatedAt: string
  }
  licenses: {
    active: Array<{
      id: string
      licenseKey: string
      tier: string
      isActive: boolean
      isLifetime: boolean
      seatsAllowed: number
      seatsUsed: number
      validFrom: string
      validUntil?: string
      paymentStatus: string
      amountPaid: number
      currency: string
      createdAt: string
    }>
    highest?: {
      id: string
      licenseKey: string
      tier: string
      isActive: boolean
      isLifetime: boolean
      seatsAllowed: number
      seatsUsed: number
      validFrom: string
      validUntil?: string
      paymentStatus: string
      amountPaid: number
      currency: string
      createdAt: string
    }
    count: number
  }
  permissions: {
    canAccessPremium: boolean
    canManageUsers: boolean
    canManageComponents: boolean
    canManageCategories: boolean
    maxApiCalls: number
    teamSeats: number
  }
  subscription: {
    hasActiveSubscription: boolean
    tier: string
    expiresAt?: string
    teamSeats?: number
    usedSeats?: number
  }
  stats: {
    totalLicenses: number
    isPremium: boolean
    isAdmin: boolean
    accountAge: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        
        // Vérifier d'abord si l'utilisateur est connecté
        const session = await authClient.getSession()
        if (!session?.user) {
          router.push('/auth/magic-link')
          return
        }

        // Récupérer les données du dashboard
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/user/dashboard`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/auth/magic-link')
            return
          }
          throw new Error('Erreur lors de la récupération des données')
        }

        const result = await response.json()
        if (result.success) {
          setDashboardData(result.data)
        } else {
          throw new Error(result.error?.message || 'Erreur inconnue')
        }
      } catch (err) {
        console.error('Erreur dashboard:', err)
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      router.push('/')
    } catch (error) {
      console.error('Erreur de déconnexion:', error)
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      })
    }
  }

  const handleCopyLicenseKey = (licenseKey: string) => {
    toast({
      title: "Copié !",
      description: "Clé de licence copiée dans le presse-papiers",
    })
  }

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'free': return 'bg-gray-100 text-gray-800'
      case 'pro': return 'bg-blue-100 text-blue-800'
      case 'team': return 'bg-purple-100 text-purple-800'
      case 'enterprise': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'pro': return <Shield className="w-4 h-4" />
      case 'team': return <User className="w-4 h-4" />
      case 'enterprise': return <Crown className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement de votre dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#FAF3E0] rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">❌</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return null
  }

  const { user, licenses, permissions, subscription, stats } = dashboardData

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-[#FAF3E0] shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Bonjour, {user.name || user.email}
                </h1>
                <p className="text-gray-600">
                  Bienvenue dans votre espace premium Ona UI
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={getTierColor(subscription.tier)}>
                {getTierIcon(subscription.tier)}
                <span className="ml-1 capitalize">{subscription.tier}</span>
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Stats Section */}
          <div className="lg:col-span-3">
            <UserStats
              stats={stats}
              permissions={permissions}
              subscription={subscription}
            />
          </div>

          {/* User Profile */}
          <div className="lg:col-span-1">
            <UserProfile user={user} />
          </div>

          {/* Licenses */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Mes licences
                </CardTitle>
                <CardDescription>
                  Gérez vos licences premium et accédez à vos clés
                </CardDescription>
              </CardHeader>
              <CardContent>
                {licenses.active.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Aucune licence premium active</p>
                    <Button asChild>
                      <a href="/pricing">Obtenir une licence premium</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {licenses.active.map((license) => (
                      <LicenseCard
                        key={license.id}
                        license={license}
                        onCopyKey={handleCopyLicenseKey}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
                <CardDescription>
                  Accédez rapidement aux fonctionnalités principales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button asChild className="h-auto p-4 flex-col">
                    <a href="/docs/components">
                      <Download className="w-6 h-6 mb-2" />
                      <span className="font-medium">Télécharger composants</span>
                      <span className="text-xs opacity-75">Accéder à la bibliothèque</span>
                    </a>
                  </Button>

                  <Button asChild variant="outline" className="h-auto p-4 flex-col">
                    <a href="/docs">
                      <Settings className="w-6 h-6 mb-2" />
                      <span className="font-medium">Documentation</span>
                      <span className="text-xs opacity-75">Guides et tutoriels</span>
                    </a>
                  </Button>

                  <Button asChild variant="outline" className="h-auto p-4 flex-col">
                    <a href="/pricing">
                      <Crown className="w-6 h-6 mb-2" />
                      <span className="font-medium">Upgrade</span>
                      <span className="text-xs opacity-75">Améliorer votre plan</span>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}