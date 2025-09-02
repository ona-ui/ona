'use client'

import { Crown, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { signOut } from '@/lib/auth-client'

interface PremiumIndicatorProps {
  className?: string
  showUserMenu?: boolean
}

export function PremiumIndicator({ className = '', showUserMenu = true }: PremiumIndicatorProps) {
  const { user, isLoading, isAuthenticated, isPremium, subscription } = useAuth()

  

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Indicateur Premium */}
      {isPremium && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-[#F4D1C2] to-[#F8D9C9] text-[#7A3C2A] rounded-full ring-1 ring-[#E8915B]/40">
          <Crown className="w-3 h-3 text-[#C96342]" />
          <span className="text-xs font-medium capitalize">
            {subscription?.tier || 'Premium'}
          </span>
        </div>
      )}

      {/* Menu utilisateur */}
      {showUserMenu && (
        <div className="relative group">
          <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || user.email}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 bg-gradient-to-r from-[#C96342] to-[#E8915B] rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </button>

          {/* Menu déroulant */}
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
                  <div className="w-10 h-10 bg-[#E8915B] rounded-full flex items-center justify-center">
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
                      <Crown className="w-3 h-3 text-[#C96342]" />
                      <span className="text-xs text-[#7A3C2A] font-medium">
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
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#C96342] hover:text-[#B85A3A] hover:bg-[#FDE7DF] rounded-md transition-colors"
                >
                  <Crown className="w-4 h-4 text-[#C96342]" />
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
    </div>
  )
}

// Version compacte pour mobile
export function PremiumIndicatorCompact({ className = '' }: { className?: string }) {
  const { user, isLoading, isAuthenticated, isPremium } = useAuth()

  if (isLoading) {
    return <div className={`w-6 h-6 bg-gray-200 rounded-full animate-pulse ${className}`}></div>
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isPremium && (
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-[#F4D1C2] to-[#F8D9C9] text-[#7A3C2A] rounded-full ring-1 ring-[#E8915B]/40">
          <Crown className="w-3 h-3 text-[#C96342]" />
        </div>
      )}
      
      {user.image ? (
        <img
          src={user.image}
          alt={user.name || user.email}
          className="w-6 h-6 rounded-full object-cover"
        />
      ) : (
        <div className="w-6 h-6 bg-gradient-to-r from-[#C96342] to-[#E8915B] rounded-full flex items-center justify-center">
          <User className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  )
}