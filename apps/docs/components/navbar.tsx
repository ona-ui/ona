'use client'

import { useState, useEffect } from 'react'
import { Menu, X, LucideLayoutPanelTop, AppWindowMac, CreditCard, User, Crown, LogOut, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { PremiumIndicator, PremiumIndicatorCompact } from './premium-indicator'
import { useAuth } from '@/hooks/use-auth'
import { signOut } from '@/lib/auth-client'

const navigation = [
  { name: 'Blocks', href: '/docs/blocks', badge: null },
  { name: 'Templates', href: '/docs', badge: 'soon' },
  // { name: 'Price', href: '/pricing', badge: 'soon' },
]

function GitHubStarCounter() {
  const [stars, setStars] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/Ona-UI/ona', {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        })
        if (response.ok) {
          const data = await response.json()
          setStars(data.stargazers_count)
        }
      } catch (error) {
        console.error('Error fetching GitHub stars:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStars()
  }, [])

  const formatStars = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  return (
    <div className="flex items-center gap-1 text-xs text-slate-600">
      <Star className="w-3 h-3" />
      <span>{loading ? '...' : stars ? formatStars(stars) : '0'}</span>
    </div>
  )
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, isPremium } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  return (
    <>
      <header className="fixed top-12 left-0 right-0 z-50 bg-gradient-to-r from-[#F8F7F5]/95 via-[#F1F0EE]/95 to-[#EFEDE8]/95 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Left side - Logo + Version */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="relative">
                  <Image
                    src="https://cdn.ona-ui.com/logo-ona.png"
                    alt="Ona UI Logo"
                    width={45}
                    height={35}
                    className="transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-200/20 to-amber-200/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
                </div>
              </Link>
              <span className="text-xs bg-gradient-to-r from-slate-100 to-white text-slate-800 px-3 py-1.5 rounded-full font-semibold shadow-sm border border-slate-200/60">
                v1.0.0
              </span>
            </div>

            {/* Center - Navigation */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="hidden md:flex items-center gap-6">
                {navigation.map((item) => {
                  const isDisabled = item.badge === 'soon'
                  const baseClasses = "text-sm font-semibold transition-all duration-300 flex items-center gap-2.5 px-4 py-2.5 rounded-xl group"
                  const activeClasses = "text-slate-800 hover:text-slate-900 hover:bg-white/60 hover:shadow-md hover:scale-105 backdrop-blur-sm"
                  const disabledClasses = "text-slate-500 cursor-not-allowed opacity-60"
                  
                  const content = (
                    <>
                      {item.name === 'Blocks' && <LucideLayoutPanelTop className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />}
                      {item.name === 'Templates' && <AppWindowMac className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />}
                      {item.name === 'Price' && <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />}
                      <span className={isDisabled ? "line-through" : "group-hover:translate-x-0.5 transition-transform duration-300"}>{item.name}</span>
                      {item.badge && (
                        <span className="ml-1 px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 rounded-full border border-orange-200/60 shadow-sm group-hover:shadow-md transition-all duration-300">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )

                  if (isDisabled) {
                    return (
                      <span key={item.name} className={`${baseClasses} ${disabledClasses}`}>
                        {content}
                      </span>
                    )
                  }

                  return (
                    <Link key={item.name} href={item.href} className={`${baseClasses} ${activeClasses}`}>
                      {content}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right side - Social icons, Premium, User menu */}
            <div className="flex items-center gap-4">
              {/* Social Icons */}
              <div className="hidden sm:flex items-center gap-2">
                <a
                  href="https://twitter.com/ona_ui"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 text-slate-600 hover:text-[#C96342] transition-all duration-300 rounded-xl hover:bg-white/60 hover:shadow-md hover:scale-110 backdrop-blur-sm group"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a
                  href="https://github.com/Ona-UI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 p-2.5 text-slate-600 hover:text-[#C96342] transition-all duration-300 rounded-xl hover:bg-white/60 hover:shadow-md hover:scale-110 backdrop-blur-sm group"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.30.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.30 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <GitHubStarCounter />
                </a>
                <a
                  href="https://discord.gg/XzsMz8BjbV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 text-slate-600 hover:text-[#C96342] transition-all duration-300 rounded-xl hover:bg-white/60 hover:shadow-md hover:scale-110 backdrop-blur-sm group"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </a>
              </div>

              {/* Premium Indicator */}
              <div className="hidden md:block">
                <PremiumIndicator showUserMenu={false} />
              </div>

              {/* User Menu */}
              {isAuthenticated && isPremium && user && (
                <div className="hidden md:block relative group">
                  <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || user.email}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>

                  <div className="absolute right-0 top-full mt-1 w-64 bg-[#F1F0EE]/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || user.email}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {user.name || 'Utilisateur'}
                          </p>
                          <p className="text-xs text-slate-600 truncate">
                            {user.email}
                          </p>
                          {isPremium && (
                            <div className="flex items-center gap-1 mt-1">
                              <Crown className="w-3 h-3 text-amber-600" />
                              <span className="text-xs text-amber-700 font-medium">
                                Compte Premium
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Mon Dashboard
                      </Link>
                      
                      {!isPremium && (
                        <Link
                          href="/pricing"
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-md transition-colors"
                        >
                          <Crown className="w-4 h-4" />
                          Passer Premium
                        </Link>
                      )}

                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Join Discord Button */}
              <a
                href="https://discord.gg/XzsMz8BjbV"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#C96342] to-[#B55638] hover:from-[#B55638] hover:to-[#A14D2F] rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
                </svg>
                Join Discord
              </a>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 text-slate-700 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-[#F1F0EE]/95 backdrop-blur-md px-4 py-4 sm:max-w-sm border-l border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <Image
                  src="https://cdn.ona-ui.com/logo-ona.png"
                  alt="Ona UI Logo"
                  width={100}
                  height={25}
                />
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full font-medium">v1.0.0</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:text-zinc-800 transition-colors rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mobile Navigation */}
            <div className="space-y-1 mb-6">
              {navigation.map((item) => {
                const isDisabled = item.badge === 'soon'
                const baseClasses = "block px-3 py-3 text-base font-medium rounded-lg transition-colors"
                const activeClasses = "text-slate-700 hover:text-zinc-800 hover:bg-slate-100"
                const disabledClasses = "text-slate-500 cursor-not-allowed"
                
                const content = (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.name === 'Blocks' && <LucideLayoutPanelTop className="w-5 h-5"/>}
                      {item.name === 'Templates' && <AppWindowMac className="w-5 h-5" />}
                      {item.name === 'Price' && <CreditCard className="w-5 h-5" />}
                      <span className={isDisabled ? "line-through" : ""}>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 rounded-full ring-1 ring-orange-200/50">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )

                if (isDisabled) {
                  return (
                    <div key={item.name} className={`${baseClasses} ${disabledClasses}`}>
                      {content}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${baseClasses} ${activeClasses}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {content}
                  </Link>
                )
              })}
            </div>
            
            {/* Mobile Premium Indicator & User Menu */}
            <div className="mb-6">
              {isPremium && <PremiumIndicator showUserMenu={true} />}
            </div>
            
            {/* Mobile Social Links */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">Follow us:</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://twitter.com/ona_ui"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-700 hover:text-[#C96342] transition-colors rounded-lg hover:bg-slate-100"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a
                    href="https://github.com/Ona-UI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 p-2 text-slate-700 hover:text-[#C96342] transition-colors rounded-lg hover:bg-slate-100"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.30.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.30 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <GitHubStarCounter />
                  </a>
                  <a
                    href="https://discord.gg/XzsMz8BjbV"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-700 hover:text-[#C96342] transition-colors rounded-lg hover:bg-slate-100"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}