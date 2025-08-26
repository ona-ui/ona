"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Switch } from "@workspace/ui/components/switch"
import { Separator } from "@workspace/ui/components/separator"
import { 
  SaveIcon, 
  SettingsIcon, 
  UserIcon, 
  BellIcon,
  ShieldIcon,
  DatabaseIcon,
  PaletteIcon
} from "lucide-react"
import { Breadcrumbs } from "../../../components/admin/breadcrumbs"
import { useAuth } from "../../../hooks/use-auth"

interface SettingsSection {
  id: string
  title: string
  description: string
  icon: React.ElementType
}

const settingsSections: SettingsSection[] = [
  {
    id: "general",
    title: "Général",
    description: "Paramètres généraux de l'application",
    icon: SettingsIcon
  },
  {
    id: "profile",
    title: "Profil", 
    description: "Informations de votre compte",
    icon: UserIcon
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Préférences de notification",
    icon: BellIcon
  },
  {
    id: "security",
    title: "Sécurité",
    description: "Paramètres de sécurité et authentification",
    icon: ShieldIcon
  },
  {
    id: "data",
    title: "Données",
    description: "Import/export et sauvegarde",
    icon: DatabaseIcon
  },
  {
    id: "appearance",
    title: "Apparence",
    description: "Thème et personnalisation",
    icon: PaletteIcon
  }
]

function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Paramètres généraux</h3>
        <p className="text-sm text-muted-foreground">
          Configuration globale de l'application.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="app-name">Nom de l'application</Label>
          <Input
            id="app-name"
            placeholder="Ona UI Admin"
            defaultValue="Ona UI Admin"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="app-description">Description</Label>
          <Textarea
            id="app-description"
            placeholder="Description de l'application"
            defaultValue="Interface d'administration pour la gestion des composants UI"
            rows={3}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch id="maintenance-mode" />
          <Label htmlFor="maintenance-mode">Mode maintenance</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch id="debug-mode" />
          <Label htmlFor="debug-mode">Mode debug</Label>
        </div>
      </div>
    </div>
  )
}

function ProfileSettings() {
  const { user } = useAuth()
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Informations du profil</h3>
        <p className="text-sm text-muted-foreground">
          Gérez vos informations personnelles.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display-name">Nom d'affichage</Label>
          <Input
            id="display-name"
            placeholder="Votre nom"
            defaultValue={user?.name || ""}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="votre.email@example.com"
            defaultValue={user?.email || ""}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Une courte description..."
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Préférences de notification</h3>
        <p className="text-sm text-muted-foreground">
          Choisissez comment vous souhaitez être notifié.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Nouveaux composants</Label>
            <div className="text-sm text-muted-foreground">
              Être notifié lors de l'ajout de nouveaux composants
            </div>
          </div>
          <Switch defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Commentaires</Label>
            <div className="text-sm text-muted-foreground">
              Recevoir les notifications de commentaires
            </div>
          </div>
          <Switch defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Mises à jour système</Label>
            <div className="text-sm text-muted-foreground">
              Notifications des mises à jour importantes
            </div>
          </div>
          <Switch />
        </div>
      </div>
    </div>
  )
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Sécurité</h3>
        <p className="text-sm text-muted-foreground">
          Gérez la sécurité de votre compte.
        </p>
      </div>
      
      <div className="space-y-4">
        <Button variant="outline">
          Changer le mot de passe
        </Button>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Authentification à deux facteurs</Label>
            <div className="text-sm text-muted-foreground">
              Ajouter une couche de sécurité supplémentaire
            </div>
          </div>
          <Switch />
        </div>
        
        <Button variant="outline">
          Voir les sessions actives
        </Button>
      </div>
    </div>
  )
}

function DataSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Gestion des données</h3>
        <p className="text-sm text-muted-foreground">
          Import, export et sauvegarde de vos données.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Exporter les données</Label>
          <div className="flex space-x-2">
            <Button variant="outline">Exporter les composants</Button>
            <Button variant="outline">Exporter les catégories</Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Sauvegarde automatique</Label>
          <div className="flex items-center space-x-2">
            <Switch defaultChecked />
            <span className="text-sm text-muted-foreground">
              Sauvegarde quotidienne à 02:00
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Nettoyage</Label>
          <Button variant="outline" className="text-red-600 hover:text-red-700">
            Nettoyer les fichiers temporaires
          </Button>
        </div>
      </div>
    </div>
  )
}

function AppearanceSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Apparence</h3>
        <p className="text-sm text-muted-foreground">
          Personnalisez l'apparence de l'interface.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Thème</Label>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">Clair</Button>
            <Button variant="outline" size="sm">Sombre</Button>
            <Button variant="default" size="sm">Système</Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Densité d'affichage</Label>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">Compacte</Button>
            <Button variant="default" size="sm">Normale</Button>
            <Button variant="outline" size="sm">Spacieuse</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = React.useState("general")

  const renderSettingsContent = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSettings />
      case "notifications":
        return <NotificationSettings />
      case "security":
        return <SecuritySettings />
      case "data":
        return <DataSettings />
      case "appearance":
        return <AppearanceSettings />
      default:
        return <GeneralSettings />
    }
  }

  const breadcrumbItems = [
    { label: "Paramètres" }
  ]

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="space-y-1">
        <Breadcrumbs items={breadcrumbItems} />
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez les préférences et la configuration de votre compte.
        </p>
      </div>

      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        {/* Menu de navigation */}
        <aside className="lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {settingsSections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`${
                    activeSection === section.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  } flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {section.title}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Contenu des paramètres */}
        <div className="flex-1 lg:max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {React.createElement(
                  settingsSections.find(s => s.id === activeSection)?.icon || SettingsIcon,
                  { className: "mr-2 h-5 w-5" }
                )}
                {settingsSections.find(s => s.id === activeSection)?.title}
              </CardTitle>
              <CardDescription>
                {settingsSections.find(s => s.id === activeSection)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderSettingsContent()}
              
              <Separator className="my-6" />
              
              <div className="flex justify-end">
                <Button>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Enregistrer les modifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}