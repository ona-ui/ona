"use client"

import * as React from "react"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form"
import { XIcon, ImageIcon, ExternalLinkIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

interface ImageInputWithPreviewProps {
  label: string
  placeholder?: string
  description?: string
  value?: string
  onChange: (value: string) => void
  className?: string
  previewSize?: "small" | "medium" | "large"
  disabled?: boolean
}

const previewSizes = {
  small: "w-16 h-12",
  medium: "w-24 h-16", 
  large: "w-32 h-20"
}

export function ImageInputWithPreview({
  label,
  placeholder = "https://exemple.com/image.jpg",
  description,
  value = "",
  onChange,
  className,
  previewSize = "medium",
  disabled = false
}: ImageInputWithPreviewProps) {
  const [imageError, setImageError] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  // Réinitialiser l'erreur quand l'URL change
  React.useEffect(() => {
    setImageError(false)
    if (value) {
      setIsLoading(true)
    }
  }, [value])

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setImageError(true)
  }

  const handleClear = () => {
    onChange("")
    setImageError(false)
    setIsLoading(false)
  }

  const handleOpenImage = () => {
    if (value && !imageError) {
      window.open(value, '_blank')
    }
  }

  const isValidUrl = value && value.startsWith('http')

  return (
    <FormItem className={className}>
      <FormLabel>{label}</FormLabel>
      <div className="space-y-3">
        <div className="flex gap-2">
          <FormControl>
            <Input
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="flex-1"
            />
          </FormControl>
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="px-2"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Preview de l'image */}
        {isValidUrl && (
          <div className="flex items-start gap-3">
            <div className={cn(
              "relative border rounded-md overflow-hidden bg-gray-50 flex-shrink-0",
              previewSizes[previewSize]
            )}>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                </div>
              )}
              
              {imageError ? (
                <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-500">
                  <ImageIcon className="h-4 w-4" />
                </div>
              ) : (
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {imageError ? (
                <div className="text-sm text-red-600">
                  <p className="font-medium">Erreur de chargement</p>
                  <p className="text-xs">Vérifiez que l'URL est valide et accessible</p>
                </div>
              ) : (
                <div className="text-sm text-green-600">
                  <p className="font-medium">Image chargée avec succès</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenImage}
                      className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLinkIcon className="h-3 w-3 mr-1" />
                      Voir en grand
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!isValidUrl && value && (
          <div className="text-sm text-amber-600">
            <p className="font-medium">URL invalide</p>
            <p className="text-xs">L'URL doit commencer par http:// ou https://</p>
          </div>
        )}
      </div>

      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  )
}