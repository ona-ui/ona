"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CodeIcon,
  StarIcon,
  MoonIcon,
  SunIcon
} from "lucide-react"
import type { ComponentVersion } from "@workspace/types/components"
import { useDeleteVersion } from "../../../hooks/use-versions"

interface VersionListProps {
  componentId: string
  componentName: string
  versions: ComponentVersion[]
  onCreateVersion: (componentId: string) => void
  onEditVersion: (version: ComponentVersion) => void
  onDeleteVersion: (version: ComponentVersion) => void
  onSetDefaultVersion: (version: ComponentVersion) => void
  isExpanded?: boolean
  onToggleExpanded?: () => void
}

export function VersionList({
  componentId,
  componentName,
  versions,
  onCreateVersion,
  onEditVersion,
  onDeleteVersion,
  onSetDefaultVersion,
  isExpanded = false,
  onToggleExpanded
}: VersionListProps) {
  const defaultVersion = versions.find(v => v.isDefault)
  const sortedVersions = [...versions].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  const deleteVersionMutation = useDeleteVersion()

  const getFrameworkBadgeColor = (framework: string) => {
    const colors: Record<string, string> = {
      react: "bg-blue-100 text-blue-800",
      vue: "bg-green-100 text-green-800",
      angular: "bg-red-100 text-red-800",
      svelte: "bg-orange-100 text-orange-800",
      alpine: "bg-purple-100 text-purple-800",
      html: "bg-gray-100 text-gray-800"
    }
    return colors[framework] || "bg-gray-100 text-gray-800"
  }

  const getCssFrameworkLabel = (cssFramework: string) => {
    const labels: Record<string, string> = {
      tailwind_v3: "Tailwind v3",
      tailwind_v4: "Tailwind v4",
      vanilla_css: "CSS"
    }
    return labels[cssFramework] || cssFramework
  }

  return (
    <div className="border border-l-4 border-l-green-500 rounded-lg overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer bg-green-50/50">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </Button>
              <div className="flex items-center space-x-2">
                <CodeIcon className="h-5 w-5 text-green-600" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{componentName}</span>
                    {defaultVersion && (
                      <Badge variant="secondary" className="text-xs">
                        v{defaultVersion.versionNumber}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {versions.length} version{versions.length > 1 ? 's' : ''} • {defaultVersion ? `Défaut: ${defaultVersion.framework}` : 'Aucune version par défaut'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {versions.length} version{versions.length > 1 ? 's' : ''}
              </Badge>
              <div className="flex items-center space-x-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateVersion(componentId)
                  }}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-t bg-muted/10">
            {versions.length > 0 ? (
              <div className="divide-y">
                {sortedVersions.map((version) => (
                  <div key={version.id} className="flex items-center justify-between p-3 pl-12">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex items-center space-x-2">
                        {version.isDefault && (
                          <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <div className="flex items-center space-x-1">
                          {version.supportsDarkMode ? (
                            <MoonIcon className="h-3 w-3 text-blue-500" />
                          ) : (
                            <SunIcon className="h-3 w-3 text-orange-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium">v{version.versionNumber}</span>
                          {version.isDefault && (
                            <Badge variant="default" className="text-xs">Défaut</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs ${getFrameworkBadgeColor(version.framework)}`}>
                            {version.framework}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getCssFrameworkLabel(version.cssFramework)}
                          </Badge>
                          {version.supportsDarkMode && (
                            <Badge variant="secondary" className="text-xs">
                              Mode sombre
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-1">
                          Créé le {new Date(version.createdAt).toLocaleDateString('fr-FR')}
                          {version.codePreview && ` • ${Math.round(version.codePreview.length / 100)} lignes preview`}
                          {version.codeFull && ` • ${Math.round(version.codeFull.length / 100)} lignes complet`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {!version.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSetDefaultVersion(version)}
                          title="Définir comme version par défaut"
                        >
                          <StarIcon className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditVersion(version)}
                      >
                        <EditIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onDeleteVersion(version)
                          deleteVersionMutation.mutate({ componentId: version.componentId, id: version.id })
                        }}
                        disabled={deleteVersionMutation.isPending}
                      >
                        <TrashIcon className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <CodeIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune version</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => onCreateVersion(componentId)}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Créer la première version
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}