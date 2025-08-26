'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Copy, Eye, Code, Download, Heart, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Breadcrumbs } from './breadcrumbs'

interface ComponentVersion {
  id: string
  componentId: string
  versionNumber: string
  framework: string
  cssFramework: string
  codePreview?: string
  codeFull?: string
  codeEncrypted?: string
  supportsDarkMode: boolean
  darkModeCode?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface Component {
  id: string
  subcategoryId: string
  name: string
  slug: string
  description?: string
  isFree: boolean
  requiredTier: string
  accessType: string
  status: string
  isNew: boolean
  isFeatured: boolean
  conversionRate?: string
  testedCompanies?: string[]
  previewImageLarge?: string
  previewImageSmall?: string
  previewVideoUrl?: string
  tags?: string[]
  sortOrder: number
  viewCount: number
  copyCount: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
  versions?: ComponentVersion[]
  versionsCount?: number
}

interface StaticComponentViewerProps {
  component: Component
}

export function StaticComponentViewer({ component }: StaticComponentViewerProps) {
  const [activeTab, setActiveTab] = useState('preview')

  const copyToClipboard = async (version: ComponentVersion, label: string) => {
    try {
      // Utiliser codeFull pour la copie (code complet)
      const code = version.codeFull || version.codePreview || ''
      await navigator.clipboard.writeText(code)
      toast.success(`${label} copié dans le presse-papiers !`)
    } catch (err) {
      toast.error('Erreur lors de la copie')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF3E0] relative overflow-hidden">
      {/* Light grid background like hero */}
      <div className="absolute inset-0" style={{
        backgroundSize: '24px 24px'
      }}></div>
      
      <div className="relative space-y-8 px-6 py-8">
        <Breadcrumbs componentName={component.name} />

        {/* Header with hero-like styling */}
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-zinc-800 tracking-tight leading-tight mb-4">
                {component.name}
              </h1>
              {component.description && (
                <p className="text-lg text-slate-600 leading-relaxed mb-6">
                  {component.description}
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                {component.isFree && (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    Free
                  </Badge>
                )}
                {component.isNew && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                    New
                  </Badge>
                )}
                {component.isFeatured && (
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                    Featured
                  </Badge>
                )}
                {component.requiredTier && (
                  <Badge variant="outline" className="text-slate-600 border-slate-300 bg-[#FAF3E0]/80">
                    {component.requiredTier}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="text-slate-700 border-slate-300 hover:bg-slate-50 transition-colors">
                <Heart className="w-4 h-4 mr-2" />
                Favoris
              </Button>
              <Button variant="outline" size="sm" className="text-slate-700 border-slate-300 hover:bg-slate-50 transition-colors">
                <Star className="w-4 h-4 mr-2" />
                Noter
              </Button>
            </div>
          </div>
        </div>

        {/* Stats with hero-like styling */}
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-[#FAF3E0]/80 backdrop-blur-sm border shadow-sm">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-zinc-800">
                  {component.viewCount || 0}
                </div>
                <p className="text-sm text-slate-600">Vues</p>
              </CardContent>
            </Card>
            <Card className="bg-[#FAF3E0]/80 backdrop-blur-sm border shadow-sm">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-zinc-800">
                  {component.copyCount || 0}
                </div>
                <p className="text-sm text-slate-600">Copies</p>
              </CardContent>
            </Card>
            <Card className="bg-[#FAF3E0]/80 backdrop-blur-sm border shadow-sm">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-zinc-800">
                  {component.versions?.length || 0}
                </div>
                <p className="text-sm text-slate-600">Versions</p>
              </CardContent>
            </Card>
            <Card className="bg-[#FAF3E0]/80 backdrop-blur-sm border shadow-sm">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-zinc-800">
                  {component.conversionRate || '0%'}
                </div>
                <p className="text-sm text-slate-600">Taux de conversion</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content with the style you provided */}
        <div className="mx-auto max-w-7xl">
          <div className="relative my-8 flex flex-col space-y-4 lg:max-w-[120ch]">
            <div className="flex flex-col gap-4 relative mr-auto w-full">
              <div className="flex items-center justify-between pb-4">
                <div className="text-slate-600 inline-flex h-10 items-center w-full justify-start rounded-none border-b border-slate-200 bg-transparent p-0">
                  <button 
                    onClick={() => setActiveTab('preview')}
                    className={`cursor-pointer relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-6 pb-3 pt-3 font-semibold transition-colors shadow-none ${
                      activeTab === 'preview' 
                        ? 'border-b-zinc-800 text-zinc-800' 
                        : 'text-slate-600 hover:text-zinc-800'
                    }`}
                  >
                    Preview
                  </button>
                  <button 
                    onClick={() => setActiveTab('code')}
                    className={`cursor-pointer relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-6 pb-3 pt-3 font-semibold transition-colors shadow-none ${
                      activeTab === 'code' 
                        ? 'border-b-zinc-800 text-zinc-800' 
                        : 'text-slate-600 hover:text-zinc-800'
                    }`}
                  >
                    Code
                  </button>
                  <button 
                    onClick={() => setActiveTab('details')}
                    className={`cursor-pointer relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-6 pb-3 pt-3 font-semibold transition-colors shadow-none ${
                      activeTab === 'details' 
                        ? 'border-b-zinc-800 text-zinc-800' 
                        : 'text-slate-600 hover:text-zinc-800'
                    }`}
                  >
                    Détails
                  </button>
                </div>
              </div>

              {activeTab === 'preview' && (
                <div className="flex-1 outline-none relative rounded-xl">
                  <div className="max-w-screen relative rounded-xl border border-slate-200 bg-[#FAF3E0]/90 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center justify-end gap-3 p-4 border-b border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-slate-700 border-slate-300 hover:bg-slate-50 transition-colors"
                        onClick={() => window.open(`/preview/${component.id}`, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Plein écran
                      </Button>
                    </div>
                    <div className="flex min-h-[400px] w-full items-center justify-center p-10">
                      {component.versions && component.versions.length > 0 && component.versions[0]?.codePreview ? (
                        <div
                          className="w-full"
                          dangerouslySetInnerHTML={{
                            __html: component.versions[0].codePreview
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-center text-slate-400">
                          <div>
                            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">Preview du composant</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'code' && (
                <div className="flex-1 outline-none">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-zinc-800">Code source</h3>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-slate-700 border-slate-300 hover:bg-slate-50 transition-colors"
                          onClick={() => component.versions?.[0] && copyToClipboard(component.versions[0], 'Code complet')}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copier tout
                        </Button>
                        <Button variant="outline" size="sm" className="text-slate-700 border-slate-300 hover:bg-slate-50 transition-colors">
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                    </div>

                    {component.versions && component.versions.length > 0 ? (
                      <div className="space-y-6">
                        {component.versions.map((version: ComponentVersion) => (
                          <div key={version.id} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-700">{version.framework}</Badge>
                                <Badge variant="outline" className="border-slate-300 text-slate-600">{version.cssFramework}</Badge>
                                <span className="text-sm text-slate-500">
                                  Version {version.versionNumber}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-600 hover:bg-slate-100 transition-colors"
                                onClick={() => copyToClipboard(version, `Code ${version.framework}`)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <pre className="bg-slate-50 border border-slate-200 text-slate-800 p-5 rounded-lg overflow-x-auto text-sm max-h-[500px] overflow-y-auto">
                              <code className="leading-relaxed">{version.codeFull || 'Code complet non disponible'}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-slate-500">
                        <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Code source non disponible</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="flex-1 outline-none">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-800 mb-6">Informations détaillées</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-5">
                          <div>
                            <label className="text-sm font-medium text-slate-700">Statut</label>
                            <p className="text-sm text-zinc-800 capitalize mt-1">{component.status}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700">Type d'accès</label>
                            <p className="text-sm text-zinc-800 capitalize mt-1">{component.accessType?.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700">Créé le</label>
                            <p className="text-sm text-zinc-800 mt-1">
                              {new Date(component.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-5">
                          <div>
                            <label className="text-sm font-medium text-slate-700">Publié le</label>
                            <p className="text-sm text-zinc-800 mt-1">
                              {component.publishedAt
                                ? new Date(component.publishedAt).toLocaleDateString('fr-FR')
                                : 'Non publié'
                              }
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700">Dernière modification</label>
                            <p className="text-sm text-zinc-800 mt-1">
                              {new Date(component.updatedAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          {component.tags && component.tags.length > 0 && (
                            <div>
                              <label className="text-sm font-medium text-slate-700">Tags</label>
                              <div className="flex gap-2 mt-2">
                                {component.tags.map((tag: string) => (
                                  <Badge key={tag} variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {component.testedCompanies && component.testedCompanies.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold text-zinc-800 mb-3">Entreprises testées</h4>
                        <div className="flex gap-2 flex-wrap">
                          {component.testedCompanies.map((company: string) => (
                            <Badge key={company} variant="outline" className="border-slate-300 text-slate-600">
                              {company}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}