"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  ShieldIcon, 
  ShieldCheckIcon,
  MailIcon,
  CalendarIcon,
  UserPlusIcon
} from "lucide-react"
import { DataTable, type DataTableColumn, type DataTableAction } from "../../../components/admin/data-table"
import { CreateFormDialog, ConfirmDialog, useDialog } from "../../../components/admin/form-dialog"
import { ActiveBadge } from "../../../components/admin/status-badge"
import { Breadcrumbs } from "../../../components/admin/breadcrumbs"
import type { User } from "@workspace/types/auth"

interface ExtendedUser {
  id: string
  name: string
  email: string
  role: "user" | "admin" | "super_admin"
  lastLoginAt?: string
  createdAt: string
  isActive: boolean
}

export default function UsersPage() {
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(20)
  
  const createDialog = useDialog()
  const deleteDialog = useDialog()
  const [selectedUser, setSelectedUser] = React.useState<ExtendedUser | null>(null)

  // Données mockées
  const mockUsers: ExtendedUser[] = [
    {
      id: "1" as any,
      name: "Admin Principal",
      email: "admin@ona-ui.com",
      role: "super_admin" as any,
      createdAt: "2024-01-15T10:00:00Z",
      lastLoginAt: "2024-02-15T14:30:00Z",
      isActive: true
    },
    {
      id: "2" as any,
      name: "John Doe", 
      email: "john.doe@example.com",
      role: "admin" as any,
      createdAt: "2024-01-20T09:15:00Z",
      lastLoginAt: "2024-02-14T16:45:00Z",
      isActive: true
    },
    {
      id: "3" as any,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "user" as any,
      createdAt: "2024-02-01T11:30:00Z",
      lastLoginAt: "2024-02-10T08:20:00Z",
      isActive: false
    }
  ]

  const users = mockUsers
  const total = mockUsers.length

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge variant="destructive" className="bg-red-100 text-red-700">Super Admin</Badge>
      case "admin":
        return <Badge variant="default" className="bg-blue-100 text-blue-700">Admin</Badge>
      case "user":
        return <Badge variant="outline">Utilisateur</Badge>
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  const columns: DataTableColumn<ExtendedUser>[] = [
    {
      key: "name",
      title: "Utilisateur",
      sortable: true,
      searchable: true,
      render: (value: any, item: ExtendedUser) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {item.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-muted-foreground flex items-center">
              <MailIcon className="h-3 w-3 mr-1" />
              {item.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "role",
      title: "Rôle",
      width: "150px",
      render: (value: any) => getRoleBadge(value)
    },
    {
      key: "isActive",
      title: "Statut",
      width: "100px",
      render: (value: any) => <ActiveBadge isActive={value} />
    },
    {
      key: "createdAt",
      title: "Créé le",
      width: "120px",
      sortable: true,
      render: (value: any) => (
        <div className="text-sm flex items-center text-muted-foreground">
          <CalendarIcon className="h-3 w-3 mr-1" />
          {new Date(value).toLocaleDateString('fr-FR')}
        </div>
      )
    },
    {
      key: "lastLoginAt",
      title: "Dernière connexion",
      width: "150px",
      render: (value: any) => (
        value ? (
          <div className="text-sm text-muted-foreground">
            {new Date(value).toLocaleDateString('fr-FR')}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Jamais</span>
        )
      )
    }
  ]

  const actions: DataTableAction<ExtendedUser>[] = [
    {
      key: "edit",
      label: "Modifier",
      icon: EditIcon,
      onClick: (user: ExtendedUser) => {
        setSelectedUser(user)
        console.log("Modifier utilisateur:", user.name)
      }
    },
    {
      key: "permissions",
      label: "Permissions",
      icon: ShieldIcon,
      onClick: (user: ExtendedUser) => {
        console.log("Gérer permissions:", user.name)
      },
      show: (user: ExtendedUser) => user.role !== "super_admin"
    },
    {
      key: "promote",
      label: "Promouvoir Admin",
      icon: ShieldCheckIcon,
      onClick: (user: ExtendedUser) => {
        console.log("Promouvoir:", user.name)
      },
      show: (user: ExtendedUser) => user.role === "user"
    },
    {
      key: "delete",
      label: "Supprimer",
      icon: TrashIcon,
      variant: "destructive",
      onClick: (user: ExtendedUser) => {
        setSelectedUser(user)
        deleteDialog.openDialog()
      },
      show: (user: ExtendedUser) => user.role !== "super_admin"
    }
  ]

  const batchActions = [
    {
      key: "activate",
      label: "Activer",
      onClick: (users: ExtendedUser[]) => {
        console.log("Activer utilisateurs:", users.length)
      }
    },
    {
      key: "deactivate",
      label: "Désactiver",
      onClick: (users: ExtendedUser[]) => {
        console.log("Désactiver utilisateurs:", users.length)
      }
    }
  ]

  const breadcrumbItems = [
    { label: "Utilisateurs" }
  ]

  const roleStats = {
    total: users.length,
    admins: users.filter(u => u.role === "admin" || u.role === "super_admin").length,
    users: users.filter(u => u.role === "user").length,
    active: users.filter(u => u.isActive).length
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-2xl font-semibold">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les comptes utilisateur et leurs permissions.
          </p>
        </div>

        <CreateFormDialog
          entityName="un utilisateur"
          trigger={
            <Button>
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Nouvel utilisateur
            </Button>
          }
          open={createDialog.isOpen}
          onOpenChange={createDialog.setIsOpen}
          onSubmit={createDialog.closeDialog}
          size="lg"
        >
          <div className="space-y-4">
            <p>Formulaire de création d'utilisateur à venir...</p>
          </div>
        </CreateFormDialog>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{roleStats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{roleStats.active}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <DataTable
        data={users}
        columns={columns}
        actions={actions}
        batchActions={batchActions}
        loading={false}
        selectable={true}
        pagination={{
          page,
          limit,
          total,
          onPageChange: setPage,
          onLimitChange: setLimit
        }}
        getItemId={(item: any) => item.id}
        emptyMessage="Aucun utilisateur trouvé."
      />

      {/* Dialog de suppression */}
      <ConfirmDialog
        title="Supprimer l'utilisateur"
        description="Cette action est irréversible."
        message={
          selectedUser 
            ? `Êtes-vous sûr de vouloir supprimer l'utilisateur "${selectedUser.name}" ? Toutes ses données seront définitivement perdues.`
            : ""
        }
        confirmLabel="Supprimer"
        variant="destructive"
        trigger={<div />}
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setIsOpen}
        onConfirm={() => {
          deleteDialog.closeDialog()
          console.log("Suppression confirmée pour:", selectedUser?.name)
          setSelectedUser(null)
        }}
      />
    </div>
  )
}