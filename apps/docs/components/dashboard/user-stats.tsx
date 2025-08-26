"use client"

import { Crown, Key, Users, TrendingUp, Calendar, Shield, Zap } from 'lucide-react'
import { Card, CardContent } from '@workspace/ui/components/card'

interface UserStatsProps {
  stats: {
    totalLicenses: number
    isPremium: boolean
    isAdmin: boolean
    accountAge: number
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
}

export function UserStats({ stats, permissions, subscription }: UserStatsProps) {
  const statCards = [
    {
      title: 'Statut',
      value: stats.isPremium ? 'Premium' : 'Gratuit',
      icon: Crown,
      color: stats.isPremium ? 'text-yellow-500' : 'text-gray-400',
      bgColor: stats.isPremium ? 'bg-yellow-50' : 'bg-gray-50',
    },
    {
      title: 'Licences',
      value: stats.totalLicenses.toString(),
      icon: Key,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Sièges équipe',
      value: permissions.teamSeats.toString(),
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Âge du compte',
      value: `${stats.accountAge}j`,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ]

  const permissionItems = [
    {
      label: 'Accès premium',
      value: permissions.canAccessPremium,
      icon: Crown,
    },
    {
      label: 'Gestion utilisateurs',
      value: permissions.canManageUsers,
      icon: Users,
    },
    {
      label: 'Gestion composants',
      value: permissions.canManageComponents,
      icon: Shield,
    },
    {
      label: 'Appels API/mois',
      value: permissions.maxApiCalls.toLocaleString(),
      icon: Zap,
      isNumeric: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Subscription Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Informations d'abonnement
            </h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                subscription.hasActiveSubscription ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm font-medium text-gray-700">
                {subscription.hasActiveSubscription ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Tier actuel</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {subscription.tier}
              </p>
            </div>

            {subscription.teamSeats && (
              <div>
                <p className="text-sm font-medium text-gray-600">Sièges équipe</p>
                <p className="text-lg font-semibold text-gray-900">
                  {subscription.usedSeats || 0} / {subscription.teamSeats}
                </p>
              </div>
            )}

            {subscription.expiresAt && (
              <div>
                <p className="text-sm font-medium text-gray-600">Expire le</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(subscription.expiresAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Permissions et limites
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissionItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                  </div>
                  <div>
                    {item.isNumeric ? (
                      <span className="text-sm font-semibold text-gray-900">
                        {item.value}
                      </span>
                    ) : (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.value 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.value ? 'Oui' : 'Non'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}