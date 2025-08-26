"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Switch } from "@workspace/ui/components/switch"
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
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { toast } from "@/components/admin/error-toast"
import type { FullCategory } from "@workspace/types/categories"

// Schéma de validation pour la création de sous-catégorie
const createSubcategorySchema = z.object({
  categoryId: z.string().min(1, "La catégorie est obligatoire"),
  name: z.string().min(1, "Le nom est obligatoire").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  slug: z.string().min(1, "Le slug est obligatoire").max(100, "Le slug ne peut pas dépasser 100 caractères")
    .regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets"),
  description: z.string().max(1000, "La description ne peut pas dépasser 1000 caractères").optional(),
  sortOrder: z.number().min(0).optional(),
  isActive: z.boolean().optional()
})

export type CreateSubcategoryFormData = z.infer<typeof createSubcategorySchema>

interface SubcategoryFormProps {
  onSubmit: (data: CreateSubcategoryFormData) => void
  isSubmitting: boolean
  defaultValues?: Partial<CreateSubcategoryFormData>
  onCancel: () => void
  categories: FullCategory[]
  isEdit?: boolean
  onSubmitError?: (error: unknown) => void
}

export function SubcategoryForm({
  onSubmit,
  isSubmitting,
  defaultValues,
  onCancel,
  categories,
  isEdit = false,
  onSubmitError
}: SubcategoryFormProps) {
  const { handleValidationError } = useErrorHandler()
  
  const form = useForm<CreateSubcategoryFormData>({
    resolver: zodResolver(createSubcategorySchema),
    defaultValues: {
      categoryId: "",
      name: "",
      slug: "",
      description: "",
      sortOrder: 0,
      isActive: true,
      ...defaultValues
    }
  })

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

  // Gestionnaire de soumission avec gestion d'erreurs
  const handleSubmit = async (data: CreateSubcategoryFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      if (onSubmitError) {
        onSubmitError(error)
      } else {
        handleValidationError(error)
        toast.error("Erreur", "Une erreur est survenue lors de la soumission du formulaire.")
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie parente</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.subcategoryCount} sous-catégories)
                      </option>
                    ))}
                  </select>
                </FormControl>
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
                  <FormLabel>Nom de la sous-catégorie</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Navigation Simple, Menu Responsive..."
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        // Toujours générer le slug automatiquement, même en mode édition
                        // si le slug n'a pas été modifié manuellement
                        if (!defaultValues || !defaultValues.slug || defaultValues.slug === form.getValues("slug")) {
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
                    <Input placeholder="navigation-simple, menu-responsive..." {...field} />
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
                    placeholder="Décrivez cette sous-catégorie..."
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
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordre d'affichage</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-y-0">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Visible publiquement
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
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (isEdit ? "Modification..." : "Création...") 
              : (isEdit ? "Modifier la sous-catégorie" : "Créer la sous-catégorie")
            }
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}