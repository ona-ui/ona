"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Switch } from "@workspace/ui/components/switch"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  CopyIcon,
  PlayIcon,
  DownloadIcon,
  SettingsIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  ChevronLeftIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon
} from "lucide-react"
import { DataTable, type DataTableColumn, type DataTableAction } from "../../../components/admin/data-table"
import { CreateFormDialog, ConfirmDialog, useDialog } from "../../../components/admin/form-dialog"
import { StatusBadge, ActiveBadge, TierBadge } from "../../../components/admin/status-badge"
import { Breadcrumbs } from "../../../components/admin/breadcrumbs"
import {
  useComponents,
  useCreateComponent,
  useUpdateComponent,
  useDeleteComponent,
  useDuplicateComponent
} from "../../../hooks/use-components"
import { useCategories } from "../../../hooks/use-categories"
import { useSubcategories } from "../../../hooks/use-subcategories"
import {
  useVersions,
  useCreateVersion,
  useUpdateVersion,
  useDeleteVersion
} from "../../../hooks/use-versions"
import { VersionForm, type CreateVersionFormData } from "../../../components/admin/components/version-form"
import { VersionList } from "../../../components/admin/components/version-list"
import type { FullComponent, CreateComponentData, CreateComponentVersionData, ComponentVersion } from "@workspace/types/components"
import type { ComponentStatus } from "@workspace/types"

// Schéma de validation pour la création de composant
const createComponentSchema = z.object({
  categoryId: z.string().min(1, "La catégorie est obligatoire"),
  subcategoryId: z.string().min(1, "La sous-catégorie est obligatoire"),
  name: z.string().min(1, "Le nom est obligatoire").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  slug: z.string().min(1, "Le slug est obligatoire").max(100, "Le slug ne peut pas dépasser 100 caractères")
    .regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets"),
  description: z.string().max(1000, "La description ne peut pas dépasser 1000 caractères").optional(),
  isFree: z.boolean().optional(),
  requiredTier: z.enum(["free", "pro", "team", "enterprise"]).optional(),
  tags: z.array(z.string()).optional(),
  conversionRate: z.number().min(0).max(100).optional(),
  testedCompanies: z.array(z.string()).optional(),
  sortOrder: z.number().min(0).optional(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional()
})

type CreateComponentFormData = z.infer<typeof createComponentSchema>

// Composant de formulaire de création de composant
function ComponentForm({
  onSubmit,
  isSubmitting,
  defaultValues,
  onCancel,
  categories,
  subcategories,
  selectedCategoryId,
  setSelectedCategoryId
}: {
  onSubmit: (data: CreateComponentFormData) => void
  isSubmitting: boolean
  defaultValues?: Partial<CreateComponentFormData>
  onCancel: () => void
  categories: any[]
  subcategories: any[]
  selectedCategoryId: string
  setSelectedCategoryId: (id: string) => void
}) {
  const form = useForm<CreateComponentFormData>({
    resolver: zodResolver(createComponentSchema),
    defaultValues: {
      categoryId: "",
      subcategoryId: "",
      name: "",
      slug: "",
      description: "",
      isFree: true,
      requiredTier: "free",
      tags: [],
      conversionRate: 0,
      testedCompanies: [],
      sortOrder: 0,
      isNew: false,
      isFeatured: false,
      ...defaultValues
    }
  })
  
  // Filtrer les sous-catégories en fonction de la catégorie sélectionnée
  const filteredSubcategories = subcategories.filter(
    (subcategory) => subcategory.categoryId === selectedCategoryId
  )

  // Auto-génération du slug basé sur le nom
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
    
    form.setValue("slug", slug)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    setSelectedCategoryId(value)
                    // Réinitialiser la sous-catégorie quand la catégorie change
                    form.setValue("subcategoryId", "")
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="subcategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sous-catégorie</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCategoryId}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCategoryId ? "Sélectionner une sous-catégorie" : "Sélectionnez d'abord une catégorie"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredSubcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du composant</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Hero Minimal, Pricing Card..."
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        if (!defaultValues) {
                          handleNameChange(e.target.value)
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug URL</FormLabel>
                  <FormControl>
                    <Input placeholder="hero-minimal, pricing-card..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Décrivez ce composant et son usage..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="isFree"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Gratuit</FormLabel>
                    <FormDescription>
                      Accessible aux utilisateurs gratuits
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requiredTier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau requis</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="free">Gratuit</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="team">Équipe</SelectItem>
                      <SelectItem value="enterprise">Entreprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="isNew"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Nouveau</FormLabel>
                    <FormDescription>
                      Marquer comme nouveau composant
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">En vedette</FormLabel>
                    <FormDescription>
                      Afficher en première position
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Création..." : "Créer le composant"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export default function ComponentsPage() {
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(20)
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("")
  
  const createDialog = useDialog()
  const deleteDialog = useDialog()
  const versionCreateDialog = useDialog()
  const versionDeleteDialog = useDialog()
  const versionEditDialog = useDialog()
  const [selectedComponent, setSelectedComponent] = React.useState<FullComponent | null>(null)
  const [selectedVersion, setSelectedVersion] = React.useState<ComponentVersion | null>(null)
  const [selectedComponentForVersion, setSelectedComponentForVersion] = React.useState<string>("")
  const [expandedComponents, setExpandedComponents] = React.useState<Set<string>>(new Set())

  // Hooks pour les données
  const { data: componentsResponse, isLoading, error } = useComponents({
    includeStats: true,
    includeVersions: true,
    page,
    limit
  })
  const { data: categoriesResponse } = useCategories()
  const { data: subcategoriesResponse } = useSubcategories({ categoryId: selectedCategoryId })
  const createMutation = useCreateComponent()
  const updateMutation = useUpdateComponent()
  const deleteMutation = useDeleteComponent()
  const duplicateMutation = useDuplicateComponent()
  const createVersionMutation = useCreateVersion()
  const updateVersionMutation = useUpdateVersion()
  const deleteVersionMutation = useDeleteVersion()

  // Extraction des données réelles
  // L'API retourne { data: { items: [], pagination: {} } }
  const components = Array.isArray((componentsResponse?.data as any)?.items)
    ? (componentsResponse?.data as any).items
    : Array.isArray(componentsResponse?.data) ? componentsResponse.data : []
  
  const categories = Array.isArray((categoriesResponse?.data as any)?.items)
    ? (categoriesResponse?.data as any).items
    : Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : []
    
  const subcategories = Array.isArray((subcategoriesResponse?.data as any)?.items)
    ? (subcategoriesResponse?.data as any).items
    : Array.isArray(subcategoriesResponse?.data) ? subcategoriesResponse.data : []
    
  const total = (componentsResponse?.data as any)?.pagination?.total || components.length

  // Fonction de création de composant
  const handleCreateComponent = async (data: CreateComponentFormData) => {
    try {
      const createData: CreateComponentData = {
        subcategoryId: data.subcategoryId as any,
        name: data.name,
        slug: data.slug,
        description: data.description,
        isFree: data.isFree ?? true,
        requiredTier: data.requiredTier || "free",
        accessType: "full_access" as any,
        status: "draft" as ComponentStatus,
        tags: data.tags || [],
        conversionRate: data.conversionRate,
        testedCompanies: data.testedCompanies || [],
        sortOrder: data.sortOrder || 0,
        isNew: data.isNew ?? false,
        isFeatured: data.isFeatured ?? false
      }
      
      await createMutation.mutateAsync(createData)
      createDialog.closeDialog()
      console.log("Composant créé:", data.name)
    } catch (error) {
      console.error("Erreur lors de la création:", error)
    }
  }

  // Fonction de suppression de composant
  const handleDeleteComponent = async () => {
    if (!selectedComponent) return

    try {
      await deleteMutation.mutateAsync(selectedComponent.id)
      deleteDialog.closeDialog()
      setSelectedComponent(null)
      console.log("Composant supprimé:", selectedComponent.name)
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
    }
  }

  // Fonctions de gestion des versions
  const handleCreateVersion = async (data: CreateVersionFormData) => {
    try {
      const createData: CreateComponentVersionData = {
        componentId: selectedComponentForVersion as any,
        versionNumber: data.versionNumber,
        framework: data.framework,
        cssFramework: data.cssFramework,
        codePreview: data.codePreview,
        codeFull: data.codeFull,
        supportsDarkMode: data.supportsDarkMode || false,
        darkModeCode: data.darkModeCode,
        isDefault: data.isDefault || false
      }
      
      await createVersionMutation.mutateAsync(createData)
      versionCreateDialog.closeDialog()
      setSelectedComponentForVersion("")
      console.log("Version créée:", data.versionNumber)
    } catch (error) {
      console.error("Erreur lors de la création de version:", error)
    }
  }

  const handleDeleteVersion = async () => {
    if (!selectedVersion) return

    try {
      await deleteVersionMutation.mutateAsync({ componentId: selectedVersion.componentId, id: selectedVersion.id })
      versionDeleteDialog.closeDialog()
      setSelectedVersion(null)
      console.log("Version supprimée:", selectedVersion.versionNumber)
    } catch (error) {
      console.error("Erreur lors de la suppression de version:", error)
    }
  }

  const handleEditVersion = async (data: CreateVersionFormData) => {
    if (!selectedVersion) return

    try {
      await updateVersionMutation.mutateAsync({
        componentId: selectedVersion.componentId,
        id: selectedVersion.id,
        data: {
          versionNumber: data.versionNumber,
          codePreview: data.codePreview,
          codeFull: data.codeFull,
          supportsDarkMode: data.supportsDarkMode || false,
          darkModeCode: data.darkModeCode,
          isDefault: data.isDefault || false
        }
      })
      versionEditDialog.closeDialog()
      setSelectedVersion(null)
      console.log("Version mise à jour:", data.versionNumber)
    } catch (error) {
      console.error("Erreur lors de la mise à jour de version:", error)
    }
  }

  const handleSetDefaultVersion = async (version: ComponentVersion) => {
    try {
      await updateVersionMutation.mutateAsync({
        componentId: version.componentId,
        id: version.id,
        data: { isDefault: true }
      })
      console.log("Version définie par défaut:", version.versionNumber)
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
    }
  }

  const toggleComponentExpansion = (componentId: string) => {
    const newExpanded = new Set(expandedComponents)
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId)
    } else {
      newExpanded.add(componentId)
    }
    setExpandedComponents(newExpanded)
  }

  const columns: DataTableColumn<FullComponent>[] = [
    {
      key: "name",
      title: "Composant",
      sortable: true,
      searchable: true,
      render: (value: any, item: FullComponent) => (
        <div className="flex items-center space-x-3">
          {item.previewImageLarge && (
            <div className="w-12 h-8 bg-gray-100 rounded border overflow-hidden flex-shrink-0">
              <img 
                src={item.previewImageLarge} 
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">IMG</div>';
                }}
              />
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{item.name}</span>
              {item.isNew && <Badge variant="secondary" className="text-xs">Nouveau</Badge>}
              {item.isFeatured && <Badge variant="default" className="text-xs">Vedette</Badge>}
            </div>
            <div className="text-sm text-muted-foreground">{item.slug}</div>
            {item.description && (
              <div className="text-xs text-muted-foreground truncate max-w-xs mt-1">
                {item.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: "subcategory",
      title: "Catégorie",
      render: (value: any, item: FullComponent) => (
        <div>
          <Badge variant="outline">
            {item.subcategory?.category?.name || "Non catégorisé"}
          </Badge>
          <div className="text-xs text-muted-foreground mt-1">
            {item.subcategory?.name || "Sans sous-catégorie"}
          </div>
        </div>
      )
    },
    {
      key: "status",
      title: "Statut",
      width: "100px",
      render: (value: any) => <StatusBadge status={value} />
    },
    {
      key: "isFree",
      title: "Type",
      width: "100px",
      render: (value: any) => <TierBadge isFree={value} />
    },
    {
      key: "viewCount",
      title: "Vues",
      width: "80px",
      sortable: true,
      className: "text-right",
      render: (value: any) => (
        <span className="text-sm font-mono">{value?.toLocaleString() || 0}</span>
      )
    },
    {
      key: "copyCount", 
      title: "Copies",
      width: "80px",
      sortable: true,
      className: "text-right",
      render: (value: any) => (
        <span className="text-sm font-mono">{value?.toLocaleString() || 0}</span>
      )
    },
    {
      key: "conversionRate",
      title: "Conv. %",
      width: "80px",
      sortable: true,
      className: "text-right",
      render: (value: any) => (
        value ? (
          <span className="text-sm font-mono text-green-600">
            {parseFloat(value).toFixed(1)}%
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )
      )
    },
    {
      key: "versions",
      title: "Versions",
      width: "120px",
      render: (value: any, item: FullComponent) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {item.versions?.length || 0} version(s)
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleComponentExpansion(item.id)
            }}
          >
            {expandedComponents.has(item.id) ? (
              <ChevronDownIcon className="h-3 w-3" />
            ) : (
              <ChevronRightIcon className="h-3 w-3" />
            )}
          </Button>
        </div>
      )
    }
  ]

  const actions: DataTableAction<FullComponent>[] = [
    {
      key: "preview",
      label: "Prévisualiser",
      icon: PlayIcon,
      onClick: (component: FullComponent) => {
        console.log("Prévisualiser:", component.name)
      }
    },
    {
      key: "view",
      label: "Voir les détails",
      icon: EyeIcon,
      onClick: (component: FullComponent) => {
        console.log("Voir détails:", component.name)
      }
    },
    {
      key: "versions",
      label: "Gérer les versions",
      icon: SettingsIcon,
      onClick: (component: FullComponent) => {
        console.log("Toggle versions pour:", component.name, component.id)
        toggleComponentExpansion(component.id)
      }
    },
    {
      key: "add_version",
      label: "Ajouter une version",
      icon: PlusIcon,
      onClick: (component: FullComponent) => {
        setSelectedComponentForVersion(component.id)
        versionCreateDialog.openDialog()
      }
    },
    {
      key: "edit",
      label: "Modifier",
      icon: EditIcon,
      onClick: (component: FullComponent) => {
        setSelectedComponent(component)
      }
    },
    {
      key: "duplicate",
      label: "Dupliquer",
      icon: CopyIcon,
      onClick: (component: FullComponent) => {
        console.log("Dupliquer:", component.name)
      }
    },
    {
      key: "download",
      label: "Télécharger",
      icon: DownloadIcon,
      onClick: (component: FullComponent) => {
        console.log("Télécharger:", component.name)
      }
    },
    {
      key: "delete",
      label: "Supprimer",
      icon: TrashIcon,
      variant: "destructive",
      onClick: (component: FullComponent) => {
        setSelectedComponent(component)
        deleteDialog.openDialog()
      },
      show: (component: FullComponent) => component.status === "draft"
    }
  ]

  const batchActions = [
    {
      key: "publish",
      label: "Publier",
      onClick: (components: FullComponent[]) => {
        console.log("Publier composants:", components.length)
      }
    },
    {
      key: "archive",
      label: "Archiver", 
      onClick: (components: FullComponent[]) => {
        console.log("Archiver composants:", components.length)
      }
    }
  ]

  const breadcrumbItems = [
    { label: "Composants" }
  ]

  const statusCounts = {
    total: components.length,
    published: components.filter((c: any) => c.status === 'published').length,
    draft: components.filter((c: any) => c.status === 'draft').length,
    archived: components.filter((c: any) => c.status === 'archived').length
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-2xl font-semibold">Gestion des composants</h1>
          <p className="text-muted-foreground">
            Gérez votre bibliothèque de composants UI réutilisables.
          </p>
        </div>

        <Dialog open={createDialog.isOpen} onOpenChange={createDialog.setIsOpen}>
          <Button onClick={createDialog.openDialog}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Nouveau composant
          </Button>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau composant</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau composant à votre bibliothèque.
              </DialogDescription>
            </DialogHeader>
            <ComponentForm
              onSubmit={handleCreateComponent}
              isSubmitting={createMutation.isPending}
              onCancel={createDialog.closeDialog}
              categories={categories}
              subcategories={subcategories}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publiés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vues totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {components.reduce((acc: number, c: any) => acc + (c.viewCount || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Copies totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {components.reduce((acc: number, c: any) => acc + (c.copyCount || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table des composants avec versions intégrées */}
      <Card>
        <CardHeader>
          <CardTitle>Composants et versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={false}
                      aria-label="Sélectionner tout"
                    />
                  </TableHead>
                  <TableHead>Composant</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Vues</TableHead>
                  <TableHead className="text-right">Copies</TableHead>
                  <TableHead className="text-right">Conv. %</TableHead>
                  <TableHead>Versions</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-4 text-muted-foreground">Chargement des composants...</p>
                    </TableCell>
                  </TableRow>
                ) : components.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      <div className="text-center py-12">
                        <PlusIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Aucun composant</h3>
                        <p className="text-muted-foreground mb-4">
                          Créez votre premier composant pour commencer à construire votre bibliothèque.
                        </p>
                        <Button onClick={createDialog.openDialog}>
                          <PlusIcon className="mr-2 h-4 w-4" />
                          Créer le premier composant
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  components.flatMap((component: FullComponent) => {
                    const componentRows = [
                      <TableRow key={component.id}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {component.previewImageLarge && (
                              <div className="w-12 h-8 bg-gray-100 rounded border overflow-hidden flex-shrink-0">
                                <img
                                  src={component.previewImageLarge}
                                  alt={component.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">IMG</div>';
                                  }}
                                />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{component.name}</span>
                                {component.isNew && <Badge variant="secondary" className="text-xs">Nouveau</Badge>}
                                {component.isFeatured && <Badge variant="default" className="text-xs">Vedette</Badge>}
                              </div>
                              <div className="text-sm text-muted-foreground">{component.slug}</div>
                              {component.description && (
                                <div className="text-xs text-muted-foreground truncate max-w-xs mt-1">
                                  {component.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline">
                              {component.subcategory?.category?.name || "Non catégorisé"}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {component.subcategory?.name || "Sans sous-catégorie"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={component.status} />
                        </TableCell>
                        <TableCell>
                          <TierBadge isFree={component.isFree} />
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-mono">{component.viewCount?.toLocaleString() || 0}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-mono">{component.copyCount?.toLocaleString() || 0}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {component.conversionRate ? (
                            <span className="text-sm font-mono text-green-600">
                              {parseFloat(String(component.conversionRate)).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {component.versions?.length || 0} version(s)
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                toggleComponentExpansion(component.id)
                              }}
                            >
                              {expandedComponents.has(component.id) ? (
                                <ChevronDownIcon className="h-3 w-3" />
                              ) : (
                                <ChevronRightIcon className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {actions.map((action, index) => {
                                const show = action.show ? action.show(component) : true
                                if (!show) return null

                                const Icon = action.icon
                                return (
                                  <React.Fragment key={action.key}>
                                    <DropdownMenuItem
                                      onClick={() => action.onClick(component)}
                                      className={action.variant === "destructive" ? "text-red-600" : ""}
                                    >
                                      {Icon && <Icon className="h-4 w-4 mr-2" />}
                                      {action.label}
                                    </DropdownMenuItem>
                                    {index < actions.length - 1 && <DropdownMenuSeparator />}
                                  </React.Fragment>
                                )
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ]

                    // Ajouter les lignes de versions si le composant est expandé
                    if (expandedComponents.has(component.id) && component.versions?.length) {
                      const versionRows = component.versions.map((version: ComponentVersion) => (
                        <TableRow key={`${component.id}-${version.id}`} className="bg-muted/30">
                          <TableCell></TableCell>
                          <TableCell className="pl-8">
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">v{version.versionNumber}</Badge>
                              <span className="text-sm">{version.framework}</span>
                              {version.isDefault && (
                                <Badge variant="default" className="text-xs">Défaut</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {version.cssFramework} • {version.supportsDarkMode ? 'Dark mode' : 'Light only'}
                            </div>
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell>
                            <StatusBadge status={'draft'} />
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedVersion(version)
                                    versionEditDialog.openDialog()
                                  }}
                                >
                                  <EditIcon className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                {!version.isDefault && (
                                  <DropdownMenuItem
                                    onClick={() => handleSetDefaultVersion(version)}
                                  >
                                    <EyeIcon className="h-4 w-4 mr-2" />
                                    Définir par défaut
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedVersion(version)
                                    versionDeleteDialog.openDialog()
                                  }}
                                  className="text-red-600"
                                >
                                  <TrashIcon className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                      
                      componentRows.push(...versionRows)
                    }

                    return componentRows
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Affichage de {Math.min((page - 1) * limit + 1, total)} à{" "}
                {Math.min(page * limit, total)} sur {total} composants
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Lignes par page</span>
                <Select
                  value={String(limit)}
                  onValueChange={(value) => setLimit(Number(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                >
                  <ChevronsLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Page {page} sur {Math.ceil(total / limit)}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.ceil(total / limit))}
                  disabled={page >= Math.ceil(total / limit)}
                >
                  <ChevronsRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de création de version */}
      <Dialog open={versionCreateDialog.isOpen} onOpenChange={versionCreateDialog.setIsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle version</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle version pour ce composant avec un framework spécifique.
            </DialogDescription>
          </DialogHeader>
          <VersionForm
            componentId={selectedComponentForVersion}
            onSubmit={handleCreateVersion}
            isSubmitting={createVersionMutation.isPending}
            onCancel={versionCreateDialog.closeDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <ConfirmDialog
        title="Supprimer le composant"
        description="Cette action supprimera également toutes les versions associées."
        message={
          selectedComponent
            ? `Êtes-vous sûr de vouloir supprimer "${selectedComponent.name}" et toutes ses versions ?`
            : ""
        }
        confirmLabel="Supprimer"
        variant="destructive"
        trigger={<div />}
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setIsOpen}
        onConfirm={handleDeleteComponent}
        isSubmitting={deleteMutation.isPending}
      />

      {/* Dialog de suppression de version */}
      <ConfirmDialog
        title="Supprimer la version"
        description="Cette action est irréversible."
        message={
          selectedVersion
            ? `Êtes-vous sûr de vouloir supprimer la version "${selectedVersion.versionNumber}" ?`
            : ""
        }
        confirmLabel="Supprimer"
        variant="destructive"
        trigger={<div />}
        open={versionDeleteDialog.isOpen}
        onOpenChange={versionDeleteDialog.setIsOpen}
        onConfirm={handleDeleteVersion}
        isSubmitting={deleteVersionMutation.isPending}
      />

      {/* Dialog d'édition de version */}
      <Dialog open={versionEditDialog.isOpen} onOpenChange={versionEditDialog.setIsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la version</DialogTitle>
            <DialogDescription>
              Modifiez les informations de cette version du composant.
            </DialogDescription>
          </DialogHeader>
          <VersionForm
            componentId={selectedVersion ? components.find((c: FullComponent) =>
              c.versions?.some((v: ComponentVersion) => v.id === selectedVersion.id)
            )?.id || "" : ""}
            versionId={selectedVersion?.id}
            onSubmit={handleEditVersion}
            isSubmitting={updateVersionMutation.isPending}
            defaultValues={selectedVersion ? {
              versionNumber: selectedVersion.versionNumber,
              framework: selectedVersion.framework,
              cssFramework: selectedVersion.cssFramework,
              codePreview: selectedVersion.codePreview || "",
              codeFull: selectedVersion.codeFull || "",
              supportsDarkMode: selectedVersion.supportsDarkMode,
              darkModeCode: selectedVersion.darkModeCode || "",
              isDefault: selectedVersion.isDefault
            } : undefined}
            onCancel={() => {
              versionEditDialog.closeDialog()
              setSelectedVersion(null)
            }}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}