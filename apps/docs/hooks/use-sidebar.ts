'use client'

import { useState, useEffect } from 'react'

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Charger l'état depuis localStorage au montage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored !== null) {
      setIsCollapsed(JSON.parse(stored))
    }
    setIsLoaded(true)
  }, [])

  // Sauvegarder l'état dans localStorage quand il change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
    }
  }, [isCollapsed, isLoaded])

  const toggle = () => {
    setIsCollapsed(prev => !prev)
  }

  const collapse = () => {
    setIsCollapsed(true)
  }

  const expand = () => {
    setIsCollapsed(false)
  }

  return {
    isCollapsed,
    isLoaded,
    toggle,
    collapse,
    expand
  }
}