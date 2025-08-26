"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { AuthProvider } from "./auth-provider"
import { QueryProvider } from "./query-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </NextThemesProvider>
    </QueryProvider>
  )
}
