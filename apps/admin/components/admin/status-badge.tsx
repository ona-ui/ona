"use client"

import * as React from "react"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import type { ComponentStatus } from "@workspace/types/common"

export interface StatusBadgeProps {
  status: ComponentStatus | string
  variant?: "default" | "secondary" | "destructive" | "outline"
  className?: string
}

const statusConfig = {
  draft: {
    label: "Brouillon",
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-700 hover:bg-gray-200"
  },
  published: {
    label: "Publié",
    variant: "default" as const, 
    className: "bg-green-100 text-green-700 hover:bg-green-200"
  },
  archived: {
    label: "Archivé",
    variant: "secondary" as const,
    className: "bg-orange-100 text-orange-700 hover:bg-orange-200"
  },
  deprecated: {
    label: "Obsolète",
    variant: "destructive" as const,
    className: "bg-red-100 text-red-700 hover:bg-red-200"
  }
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: "outline" as const,
    className: ""
  }

  const finalVariant = variant || config.variant

  return (
    <Badge
      variant={finalVariant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

// Composant spécialisé pour les statuts booléens (actif/inactif)
export interface ActiveBadgeProps {
  isActive: boolean
  activeLabel?: string
  inactiveLabel?: string
  className?: string
}

export function ActiveBadge({
  isActive,
  activeLabel = "Actif",
  inactiveLabel = "Inactif", 
  className
}: ActiveBadgeProps) {
  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={cn(
        isActive 
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
        className
      )}
    >
      {isActive ? activeLabel : inactiveLabel}
    </Badge>
  )
}

// Composant pour les badges de priorité
export interface PriorityBadgeProps {
  priority: "low" | "medium" | "high" | "urgent"
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = {
    low: {
      label: "Faible",
      className: "bg-blue-100 text-blue-700 hover:bg-blue-200"
    },
    medium: {
      label: "Moyenne",
      className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
    },
    high: {
      label: "Élevée",
      className: "bg-orange-100 text-orange-700 hover:bg-orange-200"
    },
    urgent: {
      label: "Urgente",
      className: "bg-red-100 text-red-700 hover:bg-red-200"
    }
  }

  const { label, className: priorityClassName } = config[priority]

  return (
    <Badge
      variant="secondary"
      className={cn(priorityClassName, className)}
    >
      {label}
    </Badge>
  )
}

// Composant pour les badges de type (gratuit/premium)
export interface TierBadgeProps {
  isFree: boolean
  freeLabel?: string
  premiumLabel?: string
  className?: string
}

export function TierBadge({
  isFree,
  freeLabel = "Gratuit",
  premiumLabel = "Premium",
  className
}: TierBadgeProps) {
  return (
    <Badge
      variant={isFree ? "outline" : "default"}
      className={cn(
        isFree 
          ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
          : "bg-purple-100 text-purple-700 hover:bg-purple-200",
        className
      )}
    >
      {isFree ? freeLabel : premiumLabel}
    </Badge>
  )
}