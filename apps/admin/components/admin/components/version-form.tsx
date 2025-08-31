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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { ENUM_VALUES } from "@workspace/types"
import type { UUID } from "@workspace/types"
import { VersionAssets } from "./version-assets"

// Schéma de validation pour la création de version
const createVersionSchema = z.object({
  versionNumber: z.string().min(1, "Le numéro de version est obligatoire").max(20, "Le numéro de version ne peut pas dépasser 20 caractères"),
  framework: z.enum(ENUM_VALUES.FRAMEWORK_TYPES, { message: "Le framework est obligatoire" }),
  cssFramework: z.enum(ENUM_VALUES.CSS_FRAMEWORKS, { message: "Le framework CSS est obligatoire" }),
  codePreview: z.string().optional(),
  codeFull: z.string().optional(),
  supportsDarkMode: z.boolean().optional(),
  darkModeCode: z.string().optional(),
  isDefault: z.boolean().optional()
})

export type CreateVersionFormData = z.infer<typeof createVersionSchema>

interface VersionFormProps {
  onSubmit: (data: CreateVersionFormData) => void
  isSubmitting: boolean
  defaultValues?: Partial<CreateVersionFormData>
  onCancel: () => void
  isEdit?: boolean
  componentId?: UUID
  versionId?: UUID
}

export function VersionForm({
  onSubmit,
  isSubmitting,
  defaultValues,
  onCancel,
  isEdit = false,
  componentId,
  versionId
}: VersionFormProps) {
  const form = useForm<CreateVersionFormData>({
    resolver: zodResolver(createVersionSchema),
    defaultValues: {
      versionNumber: "",
      framework: "react",
      cssFramework: "tailwind_v4",
      codePreview: "",
      codeFull: "",
      supportsDarkMode: false,
      darkModeCode: "",
      isDefault: false,
      ...defaultValues
    }
  })

  const watchSupportsDarkMode = form.watch("supportsDarkMode")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="versionNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de version</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 1.0.0, v2.1, beta-1..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Utilisez un format de version cohérent (ex: 1.0.0)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="framework"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Framework</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEdit}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un framework" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="html">HTML Vanilla</SelectItem>
                      <SelectItem value="react">React</SelectItem>
                      <SelectItem value="vue">Vue.js</SelectItem>
                      <SelectItem value="svelte">Svelte</SelectItem>
                      <SelectItem value="alpine">Alpine.js</SelectItem>
                      <SelectItem value="angular">Angular</SelectItem>
                    </SelectContent>
                  </Select>
                  {isEdit && (
                    <FormDescription>
                      Le framework ne peut pas être modifié après la création
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cssFramework"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Framework CSS</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEdit}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un framework CSS" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="tailwind_v3">Tailwind CSS v3</SelectItem>
                      <SelectItem value="tailwind_v4">Tailwind CSS v4</SelectItem>
                      <SelectItem value="vanilla_css">CSS Vanilla</SelectItem>
                    </SelectContent>
                  </Select>
                  {isEdit && (
                    <FormDescription>
                      Le framework CSS ne peut pas être modifié après la création
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="codePreview"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code de prévisualisation</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Code visible en prévisualisation (sans API keys, etc.)"
                    rows={8}
                    className="font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Version simplifiée du code visible publiquement
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="codeFull"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code complet</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Code complet avec toutes les fonctionnalités"
                    rows={12}
                    className="font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Version complète accessible aux utilisateurs premium
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="supportsDarkMode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Support du mode sombre</FormLabel>
                    <FormDescription>
                      Ce composant a une version mode sombre
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

            {watchSupportsDarkMode && (
              <FormField
                control={form.control}
                name="darkModeCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code mode sombre</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Variantes CSS ou code spécifique au mode sombre"
                        rows={6}
                        className="font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      CSS ou modifications spécifiques au thème sombre
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Version par défaut</FormLabel>
                    <FormDescription>
                      Utiliser cette version comme version principale
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

          {/* Section Assets */}
          <div className="space-y-4">
            <VersionAssets
              componentId={componentId || ''}
              versionId={versionId}
              isEdit={isEdit}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (isEdit ? "Modification..." : "Création...") 
              : (isEdit ? "Modifier la version" : "Créer la version")
            }
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}