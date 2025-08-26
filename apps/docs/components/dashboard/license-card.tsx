"use client"

import { useState } from 'react'
import { Copy, Check, Crown, Zap, Users, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'

interface License {
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

interface LicenseCardProps {
  license: License
  onCopyKey?: (key: string) => void
}

export function LicenseCard({ license, onCopyKey }: LicenseCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(license.licenseKey)
      setCopiedKey(license.licenseKey)
      onCopyKey?.(license.licenseKey)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (error) {
      console.error('Erreur lors de la copie:', error)
    }
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
      case 'pro': return <Zap className="w-4 h-4" />
      case 'team': return <Users className="w-4 h-4" />
      case 'enterprise': return <Crown className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'Payé'
      case 'pending': return 'En attente'
      case 'failed': return 'Échec'
      case 'refunded': return 'Remboursé'
      default: return status
    }
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={getTierColor(license.tier)}>
              {getTierIcon(license.tier)}
              <span className="ml-1 capitalize">{license.tier}</span>
            </Badge>
            <Badge variant={license.isLifetime ? "default" : "secondary"}>
              {license.isLifetime ? "À vie" : "Temporaire"}
            </Badge>
            <Badge className={getStatusColor(license.paymentStatus)}>
              {getStatusText(license.paymentStatus)}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">
              {(license.amountPaid / 100).toFixed(2)} {license.currency}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(license.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* License Key */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Clé de licence</p>
          <div className="flex items-center gap-2">
            <code className="bg-gray-100 px-3 py-2 rounded-md text-sm font-mono flex-1 select-all">
              {license.licenseKey}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyKey}
              className="flex-shrink-0"
            >
              {copiedKey === license.licenseKey ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Sièges utilisés</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((license.seatsUsed / license.seatsAllowed) * 100, 100)}%` 
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {license.seatsUsed} / {license.seatsAllowed}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600">Statut</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${license.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-gray-900">
                {license.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Validity Period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs font-medium text-gray-500">Valide depuis</p>
            <p className="text-sm text-gray-900">
              {new Date(license.validFrom).toLocaleDateString('fr-FR')}
            </p>
          </div>
          {license.validUntil && (
            <div>
              <p className="text-xs font-medium text-gray-500">Valide jusqu'au</p>
              <p className="text-sm text-gray-900">
                {new Date(license.validUntil).toLocaleDateString('fr-FR')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}