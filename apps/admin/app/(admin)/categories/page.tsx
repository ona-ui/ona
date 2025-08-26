"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  PlusIcon,
  FolderIcon,
  ComponentIcon,
  TagIcon
} from "lucide-react"
import { ConfirmDialog, useDialog } from "../../../components/admin/form-dialog"
import { Breadcrumbs } from "../../../components/admin/breadcrumbs"
import { CategoryForm, type CreateCategoryFormData } from "../../../components/admin/categories/category-form"
import { SubcategoryForm, type CreateSubcategoryFormData } from "../../../components/admin/categories/subcategory-form"
import { CategoryTreeItem } from "../../../components/admin/categories/category-tree-item"
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory
} from "../../../hooks/use-categories"
import {
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory
} from "../../../hooks/use-subcategories"
import type { FullCategory, CreateCategoryData, CreateSubcategoryData } from "@workspace/types/categories"
import { useErrorHandler } from "../../../hooks/use-error-handler"
import { toast } from "../../../components/admin/error-toast"
import { uuidv4 } from "zod"

export default function CategoriesPage() {
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(20)
  const { handleError } = useErrorHandler()
  
  // Dialog states
  const categoryCreateDialog = useDialog()
  const categoryEditDialog = useDialog()
  const subcategoryCreateDialog = useDialog()
  const subcategoryEditDialog = useDialog()
  const categoryDeleteDialog = useDialog()
  const subcategoryDeleteDialog = useDialog()
  const [selectedCategory, setSelectedCategory] = React.useState<FullCategory | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = React.useState<any | null>(null)
  const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = React.useState<string>("")

  // Hooks pour les données
  const { data: categoriesResponse, isLoading, error } = useCategories({
    includeSubcategories: true,
    page,
    limit
  })
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()
  const createSubcategoryMutation = useCreateSubcategory()
  const updateSubcategoryMutation = useUpdateSubcategory()
  const deleteSubcategoryMutation = useDeleteSubcategory()

  // Extraction des données réelles
  const categories = Array.isArray((categoriesResponse?.data as any)?.items) 
    ? (categoriesResponse?.data as any).items 
    : Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : []
    
  const total = (categoriesResponse?.data as any)?.pagination?.total || categories.length

  // Fonctions de gestion des catégories
  const handleCreateCategory = async (data: CreateCategoryFormData) => {
    try {
      const createData: CreateCategoryData = {
        productId: "ae82cd1e-4a4f-4132-8398-d62954a3443b", // TODO: gérer les produits
        name: data.name,
        slug: data.slug,
        description: data.description,
        iconName: data.iconName,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true
      }
      
      await createCategoryMutation.mutateAsync(createData)
      categoryCreateDialog.closeDialog()
      toast.success("Succès", `La catégorie "${data.name}" a été créée avec succès.`)
    } catch (error) {
      handleError(error, {
        customMessage: "Impossible de créer la catégorie. Veuillez vérifier les données saisies.",
        onError: (appError) => {
          console.error("Erreur lors de la création:", appError)
        }
      })
    }
  }

  const handleUpdateCategory = async (data: CreateCategoryFormData) => {
    if (!selectedCategory) return

    try {
      const updateData: any = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        iconName: data.iconName,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true
      }
      
      await updateCategoryMutation.mutateAsync({ id: selectedCategory.id, data: updateData })
      categoryEditDialog.closeDialog()
      setSelectedCategory(null)
      toast.success("Succès", `La catégorie "${data.name}" a été mise à jour avec succès.`)
    } catch (error) {
      handleError(error, {
        customMessage: "Impossible de mettre à jour la catégorie. Veuillez vérifier les données saisies.",
        onError: (appError) => {
          console.error("Erreur lors de la mise à jour:", appError)
        }
      })
    }
  }

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return

    try {
      await deleteCategoryMutation.mutateAsync(selectedCategory.id)
      categoryDeleteDialog.closeDialog()
      setSelectedCategory(null)
      toast.success("Succès", `La catégorie "${selectedCategory.name}" a été supprimée avec succès.`)
    } catch (error) {
      handleError(error, {
        customMessage: "Impossible de supprimer la catégorie. Vérifiez qu'elle ne contient pas de sous-catégories ou de composants.",
        onError: (appError) => {
          console.error("Erreur lors de la suppression:", appError)
        }
      })
    }
  }

  // Fonctions de gestion des sous-catégories
  const handleCreateSubcategory = async (data: CreateSubcategoryFormData) => {
    try {
      const createData: CreateSubcategoryData = {
        categoryId: data.categoryId as any,
        name: data.name,
        slug: data.slug,
        description: data.description,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true
      }
      
      await createSubcategoryMutation.mutateAsync(createData)
      subcategoryCreateDialog.closeDialog()
      setSelectedCategoryForSubcategory("")
      toast.success("Succès", `La sous-catégorie "${data.name}" a été créée avec succès.`)
    } catch (error) {
      handleError(error, {
        customMessage: "Impossible de créer la sous-catégorie. Veuillez vérifier les données saisies.",
        onError: (appError) => {
          console.error("Erreur lors de la création:", appError)
        }
      })
    }
  }

  const handleUpdateSubcategory = async (data: CreateSubcategoryFormData) => {
    if (!selectedSubcategory) return

    try {
      const updateData: any = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true
      }
      
      await updateSubcategoryMutation.mutateAsync({ id: selectedSubcategory.id, data: updateData })
      subcategoryEditDialog.closeDialog()
      setSelectedSubcategory(null)
      toast.success("Succès", `La sous-catégorie "${data.name}" a été mise à jour avec succès.`)
    } catch (error) {
      handleError(error, {
        customMessage: "Impossible de mettre à jour la sous-catégorie. Veuillez vérifier les données saisies.",
        onError: (appError) => {
          console.error("Erreur lors de la mise à jour:", appError)
        }
      })
    }
  }

  const handleDeleteSubcategory = async () => {
    if (!selectedSubcategory) return

    try {
      await deleteSubcategoryMutation.mutateAsync(selectedSubcategory.id)
      subcategoryDeleteDialog.closeDialog()
      setSelectedSubcategory(null)
      toast.success("Succès", `La sous-catégorie "${selectedSubcategory.name}" a été supprimée avec succès.`)
    } catch (error) {
      handleError(error, {
        customMessage: "Impossible de supprimer la sous-catégorie. Vérifiez qu'elle ne contient pas de composants.",
        onError: (appError) => {
          console.error("Erreur lors de la suppression:", appError)
        }
      })
    }
  }

  const breadcrumbItems = [
    { label: "Catégories & Sous-catégories" }
  ]

  // Calcul des statistiques
  const stats = {
    totalCategories: categories.length,
    totalSubcategories: categories.reduce((acc: number, cat: any) => acc + (cat.subcategoryCount || 0), 0),
    totalComponents: categories.reduce((acc: number, cat: any) => acc + (cat.componentCount || 0), 0),
    activeCategories: categories.filter((cat: any) => cat.isActive).length
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-2xl font-semibold">Gestion des catégories</h1>
          <p className="text-muted-foreground">
            Organisez votre bibliothèque avec des catégories et sous-catégories structurées.
          </p>
        </div>

        <Button onClick={categoryCreateDialog.openDialog}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Nouvelle catégorie
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catégories</CardTitle>
            <FolderIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCategories} actives
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sous-catégories</CardTitle>
            <ComponentIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubcategories}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Composants totaux</CardTitle>
            <TagIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComponents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne / Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCategories > 0 ? Math.round(stats.totalComponents / stats.totalCategories) : 0}
            </div>
            <p className="text-xs text-muted-foreground">composants par catégorie</p>
          </CardContent>
        </Card>
      </div>

      {/* Vue hiérarchique des catégories */}
      <Card>
        <CardHeader>
          <CardTitle>Structure hiérarchique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement des catégories...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Erreur de chargement</h3>
              <p className="text-muted-foreground mb-4">
                Impossible de charger les catégories. Veuillez réessayer plus tard.
              </p>
              <Button onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          ) : categories.length > 0 ? (
            categories.map((category: FullCategory) => (
              <CategoryTreeItem
                key={category.id}
                category={category}
                onEditCategory={(cat) => {
                  setSelectedCategory(cat)
                  categoryEditDialog.openDialog()
                }}
                onDeleteCategory={(cat) => {
                  setSelectedCategory(cat)
                  categoryDeleteDialog.openDialog()
                }}
                onCreateSubcategory={(categoryId) => {
                  setSelectedCategoryForSubcategory(categoryId)
                  subcategoryCreateDialog.openDialog()
                }}
                onEditSubcategory={(subcat) => {
                  setSelectedSubcategory(subcat)
                  subcategoryEditDialog.openDialog()
                }}
                onDeleteSubcategory={(subcat) => {
                  setSelectedSubcategory(subcat)
                  subcategoryDeleteDialog.openDialog()
                }}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <FolderIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune catégorie</h3>
              <p className="text-muted-foreground mb-4">
                Créez votre première catégorie pour organiser vos composants.
              </p>
              <Button onClick={categoryCreateDialog.openDialog}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Créer la première catégorie
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de création de catégorie */}
      <Dialog open={categoryCreateDialog.isOpen} onOpenChange={categoryCreateDialog.setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle catégorie</DialogTitle>
            <DialogDescription>
              Organisez vos composants en créant une nouvelle catégorie.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            onSubmit={handleCreateCategory}
            isSubmitting={createCategoryMutation.isPending}
            onCancel={categoryCreateDialog.closeDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de création de sous-catégorie */}
      <Dialog open={subcategoryCreateDialog.isOpen} onOpenChange={subcategoryCreateDialog.setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle sous-catégorie</DialogTitle>
            <DialogDescription>
              Ajoutez une sous-catégorie pour mieux organiser vos composants.
            </DialogDescription>
          </DialogHeader>
          <SubcategoryForm
            onSubmit={handleCreateSubcategory}
            isSubmitting={createSubcategoryMutation.isPending}
            onCancel={subcategoryCreateDialog.closeDialog}
            categories={categories}
            defaultValues={{ categoryId: selectedCategoryForSubcategory }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition de catégorie */}
      <Dialog open={categoryEditDialog.isOpen} onOpenChange={categoryEditDialog.setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de cette catégorie.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            onSubmit={handleUpdateCategory}
            isSubmitting={updateCategoryMutation.isPending}
            onCancel={() => {
              categoryEditDialog.closeDialog()
              setSelectedCategory(null)
            }}
            defaultValues={selectedCategory ? {
              name: selectedCategory.name,
              slug: selectedCategory.slug,
              description: selectedCategory.description || "",
              iconName: selectedCategory.iconName || "",
              sortOrder: selectedCategory.sortOrder,
              isActive: selectedCategory.isActive
            } : undefined}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition de sous-catégorie */}
      <Dialog open={subcategoryEditDialog.isOpen} onOpenChange={subcategoryEditDialog.setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier la sous-catégorie</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de cette sous-catégorie.
            </DialogDescription>
          </DialogHeader>
          <SubcategoryForm
            onSubmit={handleUpdateSubcategory}
            isSubmitting={updateSubcategoryMutation.isPending}
            onCancel={() => {
              subcategoryEditDialog.closeDialog()
              setSelectedSubcategory(null)
            }}
            categories={categories}
            defaultValues={selectedSubcategory ? {
              categoryId: selectedSubcategory.categoryId,
              name: selectedSubcategory.name,
              slug: selectedSubcategory.slug,
              description: selectedSubcategory.description || "",
              sortOrder: selectedSubcategory.sortOrder,
              isActive: selectedSubcategory.isActive
            } : undefined}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression de catégorie */}
      <ConfirmDialog
        title="Supprimer la catégorie"
        description="Cette action supprimera également toutes les sous-catégories et composants associés."
        message={
          selectedCategory
            ? `Êtes-vous sûr de vouloir supprimer "${selectedCategory.name}" et tout son contenu ?`
            : ""
        }
        confirmLabel="Supprimer"
        variant="destructive"
        trigger={<div />}
        open={categoryDeleteDialog.isOpen}
        onOpenChange={categoryDeleteDialog.setIsOpen}
        onConfirm={handleDeleteCategory}
        isSubmitting={deleteCategoryMutation.isPending}
      />

      {/* Dialog de suppression de sous-catégorie */}
      <ConfirmDialog
        title="Supprimer la sous-catégorie"
        description="Cette action supprimera également tous les composants associés."
        message={
          selectedSubcategory
            ? `Êtes-vous sûr de vouloir supprimer "${selectedSubcategory.name}" et tous ses composants ?`
            : ""
        }
        confirmLabel="Supprimer"
        variant="destructive"
        trigger={<div />}
        open={subcategoryDeleteDialog.isOpen}
        onOpenChange={subcategoryDeleteDialog.setIsOpen}
        onConfirm={handleDeleteSubcategory}
        isSubmitting={deleteSubcategoryMutation.isPending}
      />
    </div>
  )
}