"use client"

import { User, Mail, Calendar, Globe, MapPin, Twitter, Github, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar'

interface UserProfileProps {
  user: {
    id: string
    email: string
    name: string
    username?: string
    role: string
    emailVerified: boolean
    image?: string
    bio?: string
    website?: string
    company?: string
    location?: string
    twitterHandle?: string
    githubUsername?: string
    preferredFramework: string
    preferredCss: string
    darkModeDefault: boolean
    lastLoginAt?: string
    createdAt: string
    updatedAt: string
  }
}

export function UserProfile({ user }: UserProfileProps) {
  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'super_admin': return 'bg-purple-100 text-purple-800'
      case 'user': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super_admin': return 'Super Admin'
      case 'admin': return 'Administrateur'
      case 'user': return 'Utilisateur'
      default: return role
    }
  }

  const profileFields = [
    {
      label: 'Email',
      value: user.email,
      icon: Mail,
      verified: user.emailVerified,
    },
    {
      label: 'Nom d\'utilisateur',
      value: user.username ? `@${user.username}` : null,
      icon: User,
    },
    {
      label: 'Entreprise',
      value: user.company,
      icon: Settings,
    },
    {
      label: 'Localisation',
      value: user.location,
      icon: MapPin,
    },
    {
      label: 'Site web',
      value: user.website,
      icon: Globe,
      isLink: true,
    },
    {
      label: 'Twitter',
      value: user.twitterHandle ? `@${user.twitterHandle}` : null,
      icon: Twitter,
      isLink: true,
      linkUrl: user.twitterHandle ? `https://twitter.com/${user.twitterHandle}` : undefined,
    },
    {
      label: 'GitHub',
      value: user.githubUsername ? `@${user.githubUsername}` : null,
      icon: Github,
      isLink: true,
      linkUrl: user.githubUsername ? `https://github.com/${user.githubUsername}` : undefined,
    },
  ]

  const preferences = [
    {
      label: 'Framework préféré',
      value: user.preferredFramework,
    },
    {
      label: 'CSS préféré',
      value: user.preferredCss.replace('_', ' '),
    },
    {
      label: 'Mode sombre par défaut',
      value: user.darkModeDefault ? 'Oui' : 'Non',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Profil utilisateur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.image} alt={user.name || user.email} />
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user.name || 'Utilisateur'}
              </h3>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getRoleColor(user.role)}>
                {getRoleLabel(user.role)}
              </Badge>
              <Badge variant={user.emailVerified ? "default" : "destructive"}>
                {user.emailVerified ? "Email vérifié" : "Email non vérifié"}
              </Badge>
            </div>

            {user.bio && (
              <p className="text-sm text-gray-700 mt-2">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Profile Fields */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Informations
          </h4>
          <div className="space-y-3">
            {profileFields.map((field, index) => {
              if (!field.value) return null
              
              const Icon = field.icon
              return (
                <div key={index} className="flex items-center gap-3 py-2">
                  <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {field.label}
                    </p>
                    {field.isLink && field.linkUrl ? (
                      <a 
                        href={field.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {field.value}
                      </a>
                    ) : field.isLink && field.value?.startsWith('http') ? (
                      <a 
                        href={field.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {field.value}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-900">{field.value}</p>
                    )}
                  </div>
                  {field.verified !== undefined && (
                    <Badge variant={field.verified ? "default" : "destructive"} className="text-xs">
                      {field.verified ? "Vérifié" : "Non vérifié"}
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Préférences
          </h4>
          <div className="space-y-3">
            {preferences.map((pref, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <p className="text-sm font-medium text-gray-600">{pref.label}</p>
                <p className="text-sm text-gray-900 capitalize">{pref.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Compte
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Membre depuis
                </p>
                <p className="text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {user.lastLoginAt && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Dernière connexion
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(user.lastLoginAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t">
          <Button variant="outline" className="w-full">
            <Settings className="w-4 h-4 mr-2" />
            Modifier le profil
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}