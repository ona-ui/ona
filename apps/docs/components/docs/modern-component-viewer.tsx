'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Copy, Eye, Code2, ExternalLink, Sparkles, Monitor, Smartphone, Tv, RefreshCw, Maximize2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const copyCode = async () => {
    try {
      const selectedVersion = selectedFramework
        ? component.versions?.find(v => v.framework === selectedFramework)
        : component.versions?.[0]
      const codeToCopy = selectedVersion?.codeFull || ''
      await navigator.clipboard.writeText(codeToCopy)
      setIsCopied(true)
      toast.success('Code copied to clipboard!')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy code')
    }
  }

  const openFullscreen = () => {
    setIsFullscreen(true)
  }

  const closeFullscreen = () => {
    setIsFullscreen(false)
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
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-zinc-800">{component.name}</h3>
                  <div className="flex gap-2">
                    {component.isFree && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Free
                      </Badge>
                    )}
                    {component.isNew && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                        New
                      </Badge>
                    )}
                    {component.isFeatured && (
                      <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200/50 text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
                
                {component.description && (
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {component.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              {/* Compact Toggle */}
              <div className="relative bg-white rounded-lg px-1 shadow-sm border border-slate-200">
                <div className="relative flex">
                  <motion.div
                    className="absolute inset-y-1 bg-zinc-800 rounded-md"
                    initial={false}
                    animate={{
                      x: activeTab === 'preview' ? 0 : '100%',
                      width: '50%',
                    }}
                    transition={{
                      type: "tween",
                      duration: 0.2,
                      ease: "easeInOut"
                    }}
                  />
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-2 pl-4 pr-8 py-2 text-sm font-medium z-10 ${
                      activeTab === 'preview'
                        ? 'text-white'
                        : 'text-slate-600 hover:text-zinc-800'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`flex items-center gap-2 pl-4 pr-8 py-2 text-sm font-medium transition-colors relative z-10 flex-1 justify-center ${
                      activeTab === 'code'
                        ? 'text-white'
                        : 'text-slate-600 hover:text-zinc-800'
                    }`}
                  >
                    <Code2 className="w-4 h-4" />
                    Code
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Preview Controls */}
                {activeTab === 'preview' && (
                  <>
                    {/* Viewport Size Controls */}
                    <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
                      <button
                        onClick={() => setViewportSize('mobile')}
                        className={`p-1.5 rounded-md transition-all ${
                          viewportSize === 'mobile'
                            ? 'bg-zinc-800 text-white shadow-sm'
                            : 'text-slate-600 hover:text-zinc-800 hover:bg-slate-50'
                        }`}
                        title="Mobile View"
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewportSize('tablet')}
                        className={`p-1.5 rounded-md transition-all ${
                          viewportSize === 'tablet'
                            ? 'bg-zinc-800 text-white shadow-sm'
                            : 'text-slate-600 hover:text-zinc-800 hover:bg-slate-50'
                        }`}
                        title="Tablet View"
                      >
                        <Monitor className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewportSize('desktop')}
                        className={`p-1.5 rounded-md transition-all ${
                          viewportSize === 'desktop'
                            ? 'bg-zinc-800 text-white shadow-sm'
                            : 'text-slate-600 hover:text-zinc-800 hover:bg-slate-50'
                        }`}
                        title="Desktop View"
                      >
                        <Tv className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={copyCode}
                        className="p-1.5 text-slate-600 hover:text-zinc-800 hover:bg-white rounded-md transition-all"
                        title="Copy Code"
                      >
                        <AnimatePresence mode="wait">
                          {isCopied ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Copy className="w-4 h-4" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                      <button
                        onClick={refreshPreview}
                        className="p-1.5 text-slate-600 hover:text-zinc-800 hover:bg-white rounded-md transition-all"
                        title="Refresh Preview"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={openFullscreen}
                        className="p-1.5 text-slate-600 hover:text-zinc-800 hover:bg-white rounded-md transition-all"
                        title="Fullscreen Preview"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}

                {/* Framework Select - only show in code tab */}
                {activeTab === 'code' && component.versions && component.versions.length > 1 && (
                  <select
                    value={selectedFramework}
                    onChange={(e) => setSelectedFramework(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                  >
                    {component.versions.map((version) => (
                      <option key={version.id} value={version.framework}>
                        {version.framework} ({version.cssFramework})
                      </option>
                    ))}
                  </select>
                )}

                {/* Code Copy Button */}
                {activeTab === 'code' && (
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-zinc-800 hover:bg-white rounded-lg transition-all"
                  >
                    <AnimatePresence mode="wait">
                      {isCopied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-2"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Copied!</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {activeTab === 'preview' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white rounded-xl p-4 min-h-[500px] flex items-center justify-center" style={getViewportStyles()}>
                  {selectedVersion?.codePreview ? (
                    <PreviewIframe
                      key={refreshKey}
                      htmlContent={selectedVersion.codePreview}
                      viewportSize={viewportSize}
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Eye className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg">Preview not available</p>
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
              >
                {selectedVersion && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-medium text-xs">
                        {selectedVersion.framework}
                      </Badge>
                      <Badge variant="outline" className="border-slate-300 text-slate-600 text-xs">
                        {selectedVersion.cssFramework}
                      </Badge>
                      <span className="text-xs text-slate-500">v{selectedVersion.versionNumber}</span>
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
                      <pre className="p-4 overflow-x-auto text-sm max-h-[400px] overflow-y-auto">
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
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={closeFullscreen}
          >
            <div className="absolute inset-4 bg-white rounded-2xl overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-zinc-800">{component.name} - Fullscreen Preview</h3>
                  <button
                    onClick={closeFullscreen}
                    className="p-2 text-slate-600 hover:text-zinc-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-hidden">
                  <div className=" bg-[#F1F0EE] rounded-xl flex items-center justify-center">
                    {selectedVersion?.codePreview ? (
                      <PreviewIframe
                        key={`fullscreen-${refreshKey}`}
                        htmlContent={selectedVersion.codePreview}
                        viewportSize="desktop"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <Eye className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg">Preview not available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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