'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Copy, Eye, Code2, ExternalLink, Sparkles, Monitor, Smartphone, Tv, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Component {
  id: string
  name: string
  description?: string
  slug: string
  isFree: boolean
  isNew: boolean
  isFeatured: boolean
  requiredTier?: string
  viewCount?: number
  copyCount?: number
  versions?: Array<{
    id: string
    framework: string
    codePreview?: string
    codeFull?: string
    versionNumber: string
    cssFramework: string
  }>
}

interface ComponentPreviewProps {
  component: Component
}

export function ComponentPreview({ component }: ComponentPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const [selectedFramework, setSelectedFramework] = useState('')
  const [viewportSize, setViewportSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [refreshKey, setRefreshKey] = useState(0)

  const copyCode = async () => {
    try {
      const selectedVersion = selectedFramework
        ? component.versions?.find(v => v.framework === selectedFramework)
        : component.versions?.[0]
      const codeToCopy = selectedVersion?.codeFull || ''
      await navigator.clipboard.writeText(codeToCopy)
      toast.success('Code copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy code')
    }
  }

  const refreshPreview = () => {
    setRefreshKey(prev => prev + 1)
  }

  const getViewportStyles = () => {
    switch (viewportSize) {
      case 'mobile':
        return { maxWidth: '375px', margin: '0 auto' }
      case 'tablet':
        return { maxWidth: '768px', margin: '0 auto' }
      case 'desktop':
        return { maxWidth: '100%', margin: '0' }
      default:
        return { maxWidth: '100%', margin: '0' }
    }
  }

  const mainVersion = component.versions?.[0]
  const selectedVersion = selectedFramework
    ? component.versions?.find(v => v.framework === selectedFramework)
    : mainVersion

  // Initialize selected framework with first available
  useEffect(() => {
    if (component.versions && component.versions.length > 0 && !selectedFramework) {
      setSelectedFramework(component.versions[0]?.framework || '')
    }
  }, [component.versions, selectedFramework])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8"
    >
      <Card className="bg-[#FAF3E0]/80 backdrop-blur-sm border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <CardTitle className="text-2xl font-bold text-zinc-800">{component.name}</CardTitle>
                <div className="flex gap-2">
                  {component.isFree && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Free
                    </Badge>
                  )}
                  {component.isNew && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      New
                    </Badge>
                  )}
                  {component.isFeatured && (
                    <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200/50">
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
              
              {component.description && (
                <p className="text-slate-600 leading-relaxed mb-4">
                  {component.description}
                </p>
              )}
            </div>

          
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="border-t border-slate-200 pt-6">
            {/* Tabs + Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'preview'
                      ? 'bg-[#FAF3E0] text-zinc-800 shadow-sm'
                      : 'text-slate-600 hover:text-zinc-800'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'code'
                      ? 'bg-[#FAF3E0] text-zinc-800 shadow-sm'
                      : 'text-slate-600 hover:text-zinc-800'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  Code
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Preview Controls */}
                {activeTab === 'preview' && (
                  <>
                    {/* Viewport Size Controls */}
                    <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
                      <button
                        onClick={() => setViewportSize('mobile')}
                        className={`flex items-center justify-center p-2 rounded-md text-sm font-medium transition-all ${
                          viewportSize === 'mobile'
                            ? 'bg-[#FAF3E0] text-zinc-800 shadow-sm'
                            : 'text-slate-600 hover:text-zinc-800'
                        }`}
                        title="Mobile View"
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewportSize('tablet')}
                        className={`flex items-center justify-center p-2 rounded-md text-sm font-medium transition-all ${
                          viewportSize === 'tablet'
                            ? 'bg-[#FAF3E0] text-zinc-800 shadow-sm'
                            : 'text-slate-600 hover:text-zinc-800'
                        }`}
                        title="Tablet View"
                      >
                        <Monitor className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewportSize('desktop')}
                        className={`flex items-center justify-center p-2 rounded-md text-sm font-medium transition-all ${
                          viewportSize === 'desktop'
                            ? 'bg-[#FAF3E0] text-zinc-800 shadow-sm'
                            : 'text-slate-600 hover:text-zinc-800'
                        }`}
                        title="Desktop View"
                      >
                        <Tv className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Preview Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:bg-slate-100 transition-colors"
                        onClick={copyCode}
                        title="Copy Code"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:bg-slate-100 transition-colors"
                        onClick={refreshPreview}
                        title="Refresh Preview"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}

                {/* Framework Select - only show in code tab */}
                {activeTab === 'code' && component.versions && component.versions.length > 1 && (
                  <select
                    value={selectedFramework}
                    onChange={(e) => setSelectedFramework(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-[#FAF3E0] text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                  >
                    {component.versions.map((version) => (
                      <option key={version.id} value={version.framework}>
                        {version.framework} ({version.cssFramework})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {activeTab === 'preview' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-[#FAF3E0] rounded-xl border border-slate-200 p-4 min-h-[600px] flex items-center justify-center shadow-sm" style={getViewportStyles()}>
                    {selectedVersion?.codePreview ? (
                      <PreviewIframe
                        key={refreshKey}
                        htmlContent={selectedVersion.codePreview}
                        viewportSize={viewportSize}
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <Eye className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg">Full screen preview</p>
                        <p className="text-sm text-slate-500 mt-2">{component.name}</p>
                      </div>
                    )}
                  </div>
                  
                 
                </motion.div>
              )}

              {activeTab === 'code' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {selectedVersion && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-medium">
                            {selectedVersion.framework}
                          </Badge>
                          <Badge variant="outline" className="border-slate-300 text-slate-600">
                            {selectedVersion.cssFramework}
                          </Badge>
                          <span className="text-sm text-slate-500">v{selectedVersion.versionNumber}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:bg-slate-100 transition-colors"
                          onClick={() => copyCode()}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      
                      <div className="bg-slate-900 rounded-xl overflow-hidden">
                        <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-slate-300 text-sm font-mono">
                              {component.slug}.{selectedVersion.framework.toLowerCase()}
                            </span>
                          </div>
                        </div>
                        <pre className="p-6 overflow-x-auto text-sm max-h-[500px] overflow-y-auto">
                          <code className="text-slate-100 leading-relaxed font-mono">
                            {selectedVersion.codeFull || '// Full code not available'}
                          </code>
                        </pre>
                      </div>
                    </div>
                  )}

                
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Preview iframe component for safe HTML rendering
function PreviewIframe({
  htmlContent,
  viewportSize = 'desktop'
}: {
  htmlContent: string
  viewportSize?: 'mobile' | 'tablet' | 'desktop'
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      console.log('Iframe chargée avec succès')
      setIsLoaded(true)
      setHasError(false)
    }

    const handleError = () => {
      console.error('Erreur lors du chargement de l\'iframe')
      setHasError(true)
      setIsLoaded(false)
    }

    // Ajouter un timeout pour forcer l'affichage si onload ne se déclenche pas
    const loadTimeout = setTimeout(() => {
      if (!isLoaded && !hasError) {
        console.log('Timeout atteint, forçage de l\'affichage')
        setIsLoaded(true)
      }
    }, 3000)

    iframe.addEventListener('load', handleLoad)
    iframe.addEventListener('error', handleError)

    return () => {
      clearTimeout(loadTimeout)
      iframe.removeEventListener('load', handleLoad)
      iframe.removeEventListener('error', handleError)
    }
  }, [htmlContent, isLoaded, hasError])

  const getIframeStyles = () => {
    const baseStyles = {
      height: '600px',
      minHeight: '500px',
    }
    
    switch (viewportSize) {
      case 'mobile':
        return { ...baseStyles, width: '375px', maxWidth: '375px' }
      case 'tablet':
        return { ...baseStyles, width: '768px', maxWidth: '768px' }
      case 'desktop':
        return { ...baseStyles, width: '100%' }
      default:
        return { ...baseStyles, width: '100%' }
    }
  }

  return (
    <div className="relative w-full min-h-[600px] flex justify-center">
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-800 mx-auto mb-4"></div>
            <p className="text-slate-600">Chargement du composant...</p>
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg">
          <div className="text-center text-red-600">
            <p className="text-lg font-medium">Erreur de chargement</p>
            <p className="text-sm mt-2">Impossible d'afficher la prévisualisation</p>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        srcDoc={htmlContent}
        className={`border-0 rounded-lg transition-all duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${viewportSize === 'mobile' ? 'shadow-lg' : ''}`}
        style={getIframeStyles()}
        sandbox="allow-scripts allow-same-origin"
        title="Component Preview"
      />
    </div>
  )
}

// Export with old name for backward compatibility if needed
export const ModernComponentViewer = ComponentPreview