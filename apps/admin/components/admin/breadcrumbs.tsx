"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRightIcon, HomeIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ElementType
  current?: boolean
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  showHome?: boolean
  homeHref?: string
  className?: string
}

export function Breadcrumbs({
  items,
  separator = <ChevronRightIcon className="h-4 w-4" />,
  showHome = true,
  homeHref = "/admin",
  className
}: BreadcrumbsProps) {
  const allItems = showHome 
    ? [{ label: "Dashboard", href: homeHref, icon: HomeIcon }, ...items]
    : items

  return (
    <nav
      className={cn(
        "flex items-center space-x-1 text-sm text-muted-foreground",
        className
      )}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const Icon = item.icon

          return (
            <li key={index} className="flex items-center space-x-1">
              {index > 0 && (
                <span className="text-muted-foreground/50">
                  {separator}
                </span>
              )}
              
              <div className="flex items-center space-x-1">
                {Icon && (
                  <Icon className="h-4 w-4" />
                )}
                
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      isLast && "text-foreground font-medium",
                      !item.href && "text-muted-foreground"
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Hook utilitaire pour générer automatiquement les breadcrumbs basés sur l'URL
export function useBreadcrumbs(
  pathname: string,
  customLabels?: Record<string, string>
) {
  return React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)
    const items: BreadcrumbItem[] = []

    let href = ""
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      href += `/${segment}`
      
      // Skip "admin" segment as it's the home
      if (segment === "admin" && i === 0) continue
      
      const label = (customLabels && segment ? customLabels[segment] : undefined) ||
                   (segment ? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ") : "")
      
      const isLast = i === segments.length - 1
      
      items.push({
        label,
        href: isLast ? undefined : href,
        current: isLast
      })
    }

    return items
  }, [pathname, customLabels])
}

// Composant avec génération automatique
export interface AutoBreadcrumbsProps {
  pathname: string
  customLabels?: Record<string, string>
  className?: string
  showHome?: boolean
  homeHref?: string
}

export function AutoBreadcrumbs({
  pathname,
  customLabels,
  ...props
}: AutoBreadcrumbsProps) {
  const items = useBreadcrumbs(pathname, customLabels)
  
  return <Breadcrumbs items={items} {...props} />
}