"use client"

import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { queryClient } from "@/lib/query-client"

interface QueryProviderProps {
  children: React.ReactNode
}

/**
 * Provider TanStack Query avec devtools pour l'admin dashboard
 * Fournit le client de requête et les outils de développement
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools uniquement en développement */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  )
}