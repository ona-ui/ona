"use client"

import * as React from "react"
import { toast as sonnerToast } from "sonner"
import { AlertCircle, CheckCircle, Info, XCircle, AlertTriangle } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"

/**
 * Types pour les props du composant ErrorToast
 */
export interface ErrorToastProps {
  /**
   * Titre du toast
   */
  title: React.ReactNode
  /**
   * Description du message d'erreur
   */
  description?: React.ReactNode
  /**
   * Type de toast (détermine l'icône et la couleur)
   */
  variant?: "error" | "warning" | "success" | "info"
  /**
   * Action optionnelle à afficher
   */
  action?: {
    label: string
    onClick: () => void
  }
  /**
   * Fonction appelée lors de la fermeture du toast
   */
  onDismiss?: () => void
  /**
   * Classes CSS supplémentaires
   */
  className?: string
}

/**
 * Configuration des icônes et couleurs pour chaque type de toast
 */
const VARIANT_CONFIG = {
  error: {
    icon: XCircle,
    iconColor: "text-red-500",
    bgColor: "bg-red-50 border-red-200",
    textColor: "text-red-900",
    buttonVariant: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-50 border-yellow-200",
    textColor: "text-yellow-900",
    buttonVariant: "outline" as const,
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-500",
    bgColor: "bg-green-50 border-green-200",
    textColor: "text-green-900",
    buttonVariant: "default" as const,
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50 border-blue-200",
    textColor: "text-blue-900",
    buttonVariant: "outline" as const,
  },
}

/**
 * Composant de toast d'erreur personnalisé pour l'admin dashboard
 * Fournit une interface cohérente pour afficher les erreurs et autres notifications
 */
export function ErrorToast({
  title,
  description,
  variant = "error",
  action,
  onDismiss,
  className,
}: ErrorToastProps) {
  const config = VARIANT_CONFIG[variant]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "relative w-full rounded-lg border p-4 shadow-lg transition-all",
        config.bgColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex-shrink-0", config.iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 space-y-1">
          <div className={cn("font-medium", config.textColor)}>
            {title}
          </div>
          
          {description && (
            <div className={cn("text-sm", config.textColor)}>
              {description}
            </div>
          )}
          
          {action && (
            <div className="mt-2">
              <Button
                variant={config.buttonVariant}
                size="sm"
                onClick={action.onClick}
                className="text-xs"
              >
                {action.label}
              </Button>
            </div>
          )}
        </div>
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <XCircle className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Types pour les options de toast
 */
export interface ToastOptions {
  /**
   * Durée d'affichage en ms (0 = permanent)
   */
  duration?: number
  /**
   * Action optionnelle
   */
  action?: {
    label: string
    onClick: () => void
  }
  /**
   * Fonction appelée à la fermeture
   */
  onDismiss?: () => void
  /**
   * Position du toast
   */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"
}

/**
 * Service de gestion des toasts personnalisés
 * Fournit une API simple pour afficher différents types de notifications
 */
export const toast = {
  /**
   * Affiche un toast d'erreur
   */
  error: (title: React.ReactNode, description?: React.ReactNode, options?: ToastOptions) => {
    return sonnerToast.custom(
      (t) => (
        <ErrorToast
          title={title}
          description={description}
          variant="error"
          action={options?.action}
          onDismiss={() => {
            options?.onDismiss?.()
            sonnerToast.dismiss(t)
          }}
        />
      ),
      {
        duration: options?.duration ?? 5000,
        position: options?.position ?? "top-right",
      }
    )
  },

  /**
   * Affiche un toast d'avertissement
   */
  warning: (title: React.ReactNode, description?: React.ReactNode, options?: ToastOptions) => {
    return sonnerToast.custom(
      (t) => (
        <ErrorToast
          title={title}
          description={description}
          variant="warning"
          action={options?.action}
          onDismiss={() => {
            options?.onDismiss?.()
            sonnerToast.dismiss(t)
          }}
        />
      ),
      {
        duration: options?.duration ?? 4000,
        position: options?.position ?? "top-right",
      }
    )
  },

  /**
   * Affiche un toast de succès
   */
  success: (title: React.ReactNode, description?: React.ReactNode, options?: ToastOptions) => {
    return sonnerToast.custom(
      (t) => (
        <ErrorToast
          title={title}
          description={description}
          variant="success"
          action={options?.action}
          onDismiss={() => {
            options?.onDismiss?.()
            sonnerToast.dismiss(t)
          }}
        />
      ),
      {
        duration: options?.duration ?? 3000,
        position: options?.position ?? "top-right",
      }
    )
  },

  /**
   * Affiche un toast d'information
   */
  info: (title: React.ReactNode, description?: React.ReactNode, options?: ToastOptions) => {
    return sonnerToast.custom(
      (t) => (
        <ErrorToast
          title={title}
          description={description}
          variant="info"
          action={options?.action}
          onDismiss={() => {
            options?.onDismiss?.()
            sonnerToast.dismiss(t)
          }}
        />
      ),
      {
        duration: options?.duration ?? 4000,
        position: options?.position ?? "top-right",
      }
    )
  },

  /**
   * Affiche un toast personnalisé
   */
  custom: (
    title: React.ReactNode,
    description?: React.ReactNode,
    variant: ErrorToastProps["variant"] = "info",
    options?: ToastOptions
  ) => {
    return sonnerToast.custom(
      (t) => (
        <ErrorToast
          title={title}
          description={description}
          variant={variant}
          action={options?.action}
          onDismiss={() => {
            options?.onDismiss?.()
            sonnerToast.dismiss(t)
          }}
        />
      ),
      {
        duration: options?.duration ?? 4000,
        position: options?.position ?? "top-right",
      }
    )
  },

  /**
   * Ferme tous les toasts
   */
  dismiss: sonnerToast.dismiss,

  /**
   * Ferme un toast spécifique
   */
  dismissById: sonnerToast.dismiss,
}