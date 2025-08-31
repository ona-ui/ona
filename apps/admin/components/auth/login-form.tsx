"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { signIn } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"

/**
 * Schéma de validation pour le formulaire de connexion
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide"),
  password: z
    .string()
    .min(1, "Le mot de passe est requis")
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  rememberMe: z.boolean().default(false),
})

type LoginFormData = z.infer<typeof loginSchema>

/**
 * Formulaire de connexion pour l'admin dashboard
 */
export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const { isAuthenticated, isLoading: authLoading, canAccessDashboard, refetch } = useAuth()

  // Rediriger si déjà connecté avec une vérification simple
  React.useEffect(() => {
    const canAccess = canAccessDashboard()
    const shouldRedirect = !authLoading && isAuthenticated && canAccess

    console.log("🔍 [LOGIN FORM] Vérification état auth dans useEffect:", {
      authLoading,
      isAuthenticated,
      canAccessDashboard: canAccess,
      willRedirect: shouldRedirect,
      timestamp: new Date().toISOString()
    })

    if (shouldRedirect) {
      console.log("🔄 [LOGIN FORM] Utilisateur déjà connecté, redirection vers /")
      // Utiliser router.push au lieu de window.location pour éviter les problèmes de synchronisation
      router.push("/")
    }
  }, [authLoading, isAuthenticated, canAccessDashboard, router])
  
  // Récupérer les erreurs depuis les paramètres d'URL
  const urlError = searchParams?.get("error")
  React.useEffect(() => {
    if (urlError === "access_denied") {
      setError("Accès refusé. Vous n'avez pas les permissions nécessaires.")
    } else if (urlError === "auth_error") {
      setError("Erreur d'authentification. Veuillez réessayer.")
    }
  }, [urlError])

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  /**
   * Soumission du formulaire de connexion - Version simplifiée
   */
  async function onSubmit(data: LoginFormData) {
    setIsLoading(true)
    setError(null)

    console.log("🔐 [LOGIN FORM] Début connexion pour:", data.email)

    try {
      await signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      }, {
        onSuccess: async () => {
          console.log("✅ [LOGIN FORM] Connexion réussie - synchronisation session")

          // 🔧 CORRECTION: Forcer un refetch de la session immédiatement
          console.log("🔄 [LOGIN FORM] Refetch de la session...")
          await refetch()

          console.log("🔄 [LOGIN FORM] Session synchronisée - redirection")
          setIsLoading(false)

          // Utiliser router.push au lieu de window.location pour éviter les problèmes de synchronisation
          router.push("/")
        },
        onError: (ctx: any) => {
          console.error("❌ [LOGIN FORM] Erreur de connexion:", ctx.error)
          setError(
            ctx.error?.message ||
            "Une erreur s'est produite lors de la connexion"
          )
          setIsLoading(false)
        }
      })
    } catch (err) {
      console.error("💥 [LOGIN FORM] Exception lors de la connexion:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur s'est produite lors de la connexion"
      )
      setIsLoading(false)
    }
  }

  // Ne pas rendre la page si l'utilisateur est déjà connecté
  const canAccess = canAccessDashboard()
  const shouldShowSpinner = !authLoading && isAuthenticated && canAccess

  console.log("🔄 [LOGIN FORM] Vérification rendu conditionnel:", {
    authLoading,
    isAuthenticated,
    canAccessDashboard: canAccess,
    shouldShowSpinner,
    timestamp: new Date().toISOString()
  })

  if (shouldShowSpinner) {
    console.log("🔄 [LOGIN FORM] Rendu conditionnel: utilisateur connecté, affichage spinner")
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  console.log("🔄 [LOGIN FORM] Rendu normal du formulaire de connexion", {
    authLoading,
    isAuthenticated,
    canAccessDashboard: canAccessDashboard(),
    localIsLoading: isLoading
  })

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold tracking-tight">
          Connexion
        </h2>
        <p className="text-sm text-muted-foreground">
          Connectez-vous à votre compte administrateur
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="admin@ona-ui.com"
                    autoComplete="email"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }: { field: any }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    disabled={isLoading}
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border border-input"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    Se souvenir de moi
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-xs text-muted-foreground">
        <p>
          En vous connectant, vous acceptez nos conditions d'utilisation
        </p>
      </div>
    </div>
  )
}