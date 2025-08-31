"use client"

import * as React from "react"
import { redirect } from "next/navigation"
import {
  SidebarProvider,
  SidebarInset,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger
} from "@workspace/ui/components/sidebar"
import { Separator } from "@workspace/ui/components/separator"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { 
  HomeIcon, 
  FolderIcon, 
  ComponentIcon, 
  UsersIcon, 
  SettingsIcon,
  LogOutIcon,
  UserIcon,
  TagIcon,
  FileTextIcon
} from "lucide-react"
import { useAuth } from "../../hooks/use-auth"
import { Toaster } from "@workspace/ui/components/sonner"

interface AdminLayoutProps {
  children: React.ReactNode
}

function AdminSidebar() {
  const navigationItems = [
    {
      label: "Aperçu",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: HomeIcon,
        },
      ],
    },
    {
      label: "Gestion du contenu",
      items: [
        {
          title: "Catégories",
          url: "/categories",
          icon: FolderIcon,
        },
        {
          title: "Composants",
          url: "/components",
          icon: ComponentIcon,
        },
      ],
    },
    {
      label: "Administration",
      items: [
        {
          title: "Utilisateurs",
          url: "/users",
          icon: UsersIcon,
        },
        {
          title: "Paramètres",
          url: "/settings",
          icon: SettingsIcon,
        },
      ],
    },
  ]

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="gap-3">
        <div className="flex items-center gap-2 px-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ComponentIcon className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Admin Ona UI</span>
            <span className="truncate text-xs">Gestion des composants</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navigationItems.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}

function AdminHeader() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Administration</h1>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth()

  console.log("🔍 [ADMIN LAYOUT] État auth:", {
    isLoading,
    hasUser: !!user,
    userEmail: user?.email,
    userRole: user?.role,
    currentPath: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
  })

  if (isLoading) {
    console.log("⏳ [ADMIN LAYOUT] Affichage loading - auth en cours")
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log("🚫 [ADMIN LAYOUT] Pas d'utilisateur - redirection vers /login")
    redirect("/login")
  }

  // Vérifier que l'utilisateur est admin
  if (user.role !== "admin" && user.role !== "super_admin") {
    console.log("🚫 [ADMIN LAYOUT] Utilisateur non admin - redirection vers /unauthorized")
    redirect("/unauthorized")
  }

  console.log("✅ [ADMIN LAYOUT] Utilisateur admin validé - affichage dashboard")

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}