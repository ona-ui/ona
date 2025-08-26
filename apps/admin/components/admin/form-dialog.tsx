"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Loader2Icon } from "lucide-react"

export interface FormDialogProps {
  title: string
  description?: string
  trigger: React.ReactNode
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSubmit?: () => void
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
  isValid?: boolean
  size?: "sm" | "md" | "lg" | "xl" | "full"
  className?: string
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg", 
  lg: "max-w-xl",
  xl: "max-w-2xl",
  full: "max-w-7xl",
}

export function FormDialog({
  title,
  description,
  trigger,
  children,
  open,
  onOpenChange,
  onSubmit,
  onCancel,
  submitLabel = "Enregistrer",
  cancelLabel = "Annuler",
  isSubmitting = false,
  isValid = true,
  size = "md",
  className,
}: FormDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setOpen = isControlled ? onOpenChange : setInternalOpen

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.()
  }

  const handleCancel = () => {
    onCancel?.()
    setOpen?.(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent 
        className={`${sizeClasses[size]} ${className}`}
        showCloseButton={!isSubmitting}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>

          <div className="py-4">
            {children}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            {onSubmit && (
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {submitLabel}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Composant pour les formulaires de création
export interface CreateFormDialogProps extends Omit<FormDialogProps, 'title'> {
  entityName: string
}

export function CreateFormDialog({
  entityName,
  submitLabel = "Créer",
  ...props
}: CreateFormDialogProps) {
  return (
    <FormDialog
      title={`Créer ${entityName}`}
      submitLabel={submitLabel}
      {...props}
    />
  )
}

// Composant pour les formulaires d'édition
export interface EditFormDialogProps extends Omit<FormDialogProps, 'title'> {
  entityName: string
  itemName?: string
}

export function EditFormDialog({
  entityName,
  itemName,
  submitLabel = "Mettre à jour",
  ...props
}: EditFormDialogProps) {
  const title = itemName 
    ? `Modifier ${entityName} : ${itemName}`
    : `Modifier ${entityName}`

  return (
    <FormDialog
      title={title}
      submitLabel={submitLabel}
      {...props}
    />
  )
}

// Composant pour les formulaires de confirmation
export interface ConfirmDialogProps extends Omit<FormDialogProps, 'children' | 'onSubmit'> {
  message: string
  confirmLabel?: string
  variant?: "default" | "destructive"
  onConfirm: () => void
}

export function ConfirmDialog({
  message,
  confirmLabel = "Confirmer",
  variant = "default",
  onConfirm,
  isSubmitting = false,
  ...props
}: ConfirmDialogProps) {
  const handleSubmit = () => {
    onConfirm()
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogTrigger asChild>{props.trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          {props.description && (
            <DialogDescription>{props.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => props.onOpenChange?.(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook utilitaire pour gérer l'état des dialogs
export function useDialog() {
  const [isOpen, setIsOpen] = React.useState(false)

  const openDialog = () => setIsOpen(true)
  const closeDialog = () => setIsOpen(false)
  const toggleDialog = () => setIsOpen(!isOpen)

  return {
    isOpen,
    openDialog,
    closeDialog,
    toggleDialog,
    setIsOpen,
  }
}