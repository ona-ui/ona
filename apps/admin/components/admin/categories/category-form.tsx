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

// Schéma de validation pour la création de catégorie
const createCategorySchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  slug: z.string().min(1, "Le slug est obligatoire").max(100, "Le slug ne peut pas dépasser 100 caractères")
    .regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets"),
  description: z.string().max(1000, "La description ne peut pas dépasser 1000 caractères").optional(),
  iconName: z.string().optional(),
  sortOrder: z.number().min(0).optional(),
  isActive: z.boolean().optional()
})

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>

interface CategoryFormProps {
  onSubmit: (data: CreateCategoryFormData) => void
  isSubmitting: boolean
  defaultValues?: Partial<CreateCategoryFormData>
  onCancel: () => void
  isEdit?: boolean
}

export function CategoryForm({
  onSubmit,
  isSubmitting,
  defaultValues,
  onCancel,
  isEdit = false
}: CategoryFormProps) {
  const form = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      iconName: "",
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la catégorie</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Navigation, Hero Sections..."
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
                    <Input placeholder="navigation, hero-sections..." {...field} />
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
                    placeholder="Décrivez cette catégorie et son contenu..."
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
              name="iconName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icône (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="menu, layout, grid..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
          </div>

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Catégorie active</FormLabel>
                  <FormDescription>
                    Rendre cette catégorie visible publiquement
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (isEdit ? "Modification..." : "Création...") 
              : (isEdit ? "Modifier la catégorie" : "Créer la catégorie")
            }
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}