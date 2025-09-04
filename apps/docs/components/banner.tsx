'use client'

import { useState, useEffect } from 'react'
import { X, Rocket } from 'lucide-react'

interface BannerProps {
  className?: string
}

export function Banner({ className = '' }: BannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Vérifier si le banner a été fermé précédemment
  useEffect(() => {
    const bannerClosed = localStorage.getItem('ona-banner-closed')
    if (bannerClosed === 'true') {
      setIsVisible(false)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('ona-banner-closed', 'true')
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-[#C96342] to-[#E8915B] text-white ${className}`}>
      {/* Contenu du banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Message principal */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            <span className="text-sm font-medium text-center">
              🚀 Every week, we add 20+ new sections
            </span>
          </div>

          {/* Bouton de fermeture */}
          {/* <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors duration-200 ml-4"
            aria-label="Close banner"
          >
            <X className="w-4 h-4 text-white" />
          </button> */}
        </div>
      </div>

      {/* Effet de brillance subtil */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30 pointer-events-none" />
    </div>
  )
}

// Version compacte pour mobile si nécessaire
export function BannerCompact({ className = '' }: BannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const bannerClosed = localStorage.getItem('ona-banner-closed')
    if (bannerClosed === 'true') {
      setIsVisible(false)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('ona-banner-closed', 'true')
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-[#C96342] to-[#E8915B] text-white ${className}`}>
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-xs font-medium">
            🚀 Every week, we add 20+ new sections
            </span>
          </div>
          {/* <button
            onClick={handleClose}
            className="flex-shrink-0 p-0.5 rounded-full hover:bg-white/20 transition-colors duration-200"
            aria-label="Close"
          >
            <X className="w-3 h-3 text-white" />
          </button> */}
        </div>
      </div>
    </div>
  )
}