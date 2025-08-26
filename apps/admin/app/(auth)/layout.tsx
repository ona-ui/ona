import * as React from "react"

/**
 * Layout pour les pages d'authentification (login, etc.)
 * Design simple et centré pour les formulaires d'auth
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Ona UI - Interface d'administration
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}