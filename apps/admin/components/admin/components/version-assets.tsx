"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Alert,
  AlertDescription,
} from "@workspace/ui/components/alert"
import { Progress } from "@workspace/ui/components/progress"
import { Trash2, Upload, Image, Video, FileText, AlertCircle } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import type { UUID } from "@workspace/types/common"
import { 
  useVersionAssets, 
  useUploadVersionAssetsWithProgress,
  useDeleteVersionAsset,
  useValidateVersionAssets
} from "@/hooks/use-versions"

interface VersionAssetsProps {
  componentId: UUID
  versionId?: UUID
  isEdit?: boolean
  className?: string
}

interface UploadProgress {
  [filename: string]: number
}

export function VersionAssets({ 
  componentId, 
  versionId, 
  isEdit = false,
  className 
}: VersionAssetsProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({})
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Hooks pour les assets
  const { 
    data: assetsData, 
    isLoading: isLoadingAssets,
    error: assetsError 
  } = useVersionAssets(componentId, versionId || '', { enabled: isEdit && !!versionId })

  const uploadAssetsMutation = useUploadVersionAssetsWithProgress()
  const deleteAssetMutation = useDeleteVersionAsset()
  const { validateFiles } = useValidateVersionAssets()

  const assets = assetsData?.data?.assets || []

  // Gestion du drag & drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [componentId, versionId])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (files: FileList) => {
    if (!versionId) {
      setValidationErrors(["Veuillez d'abord créer la version avant d'ajouter des assets"])
      return
    }

    // Valider les fichiers
    const validation = validateFiles(files)
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      return
    }

    setValidationErrors([])

    // Upload avec progress
    uploadAssetsMutation.uploadWithProgress(componentId, versionId, files, (progress) => {
      // Simuler le progress pour chaque fichier
      const newProgress: UploadProgress = {}
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file) {
          newProgress[file.name] = progress
        }
      }
      setUploadProgress(newProgress)
    })
  }

  const handleDeleteAsset = (filename: string) => {
    if (!versionId) return

    deleteAssetMutation.mutate({
      componentId,
      versionId,
      filename
    })
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    }
    if (mimeType.startsWith('video/')) {
      return <Video className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Image'
    if (mimeType.startsWith('video/')) return 'Vidéo'
    return 'Fichier'
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Assets de la version
          </CardTitle>
          <CardDescription>
            Ajoutez des images, vidéos et autres assets pour cette version du composant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Zone de validation errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Zone d'upload */}
          <div
            className={cn(
              "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center transition-colors",
              dragActive && "border-primary bg-primary/5",
              (!versionId || uploadAssetsMutation.isPending) && "opacity-50 pointer-events-none"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-muted-foreground">
                  Formats supportés : JPG, PNG, WebP, GIF, SVG, MP4, WebM (max 50MB)
                </p>
              </div>
              <Label htmlFor="asset-upload">
                <Input
                  id="asset-upload"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileInput}
                  disabled={!versionId || uploadAssetsMutation.isPending}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  disabled={!versionId || uploadAssetsMutation.isPending}
                  asChild
                >
                  <span>
                    {uploadAssetsMutation.isPending ? "Upload en cours..." : "Sélectionner des fichiers"}
                  </span>
                </Button>
              </Label>
            </div>
          </div>

          {/* Progress bars pour les uploads en cours */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Upload en cours</Label>
              {Object.entries(uploadProgress).map(([filename, progress]) => (
                <div key={filename} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{filename}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ))}
            </div>
          )}

          {/* Liste des assets existants */}
          {isEdit && versionId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Assets actuels ({assets.length})
                </Label>
                {isLoadingAssets && (
                  <div className="text-xs text-muted-foreground">Chargement...</div>
                )}
              </div>

              {assetsError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Erreur lors du chargement des assets
                  </AlertDescription>
                </Alert>
              )}

              {assets.length === 0 && !isLoadingAssets ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun asset pour cette version</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {assets.map((asset) => (
                    <div
                      key={asset.filename}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-shrink-0">
                        {getFileIcon(asset.mimeType)}
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {asset.originalName}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {getFileTypeLabel(asset.mimeType)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(asset.size)}
                        </p>
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a 
                            href={asset.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            Voir
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAsset(asset.filename)}
                          disabled={deleteAssetMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message d'information pour les nouvelles versions */}
          {!isEdit && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vous pourrez ajouter des assets après avoir créé la version
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}