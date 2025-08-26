/**
 * Validators d'authentification et utilisateurs pour l'application Ona UI
 * 
 * Ce fichier contient tous les schémas de validation pour l'authentification,
 * la gestion des utilisateurs, et les opérations liées aux comptes.
 */

import vine from '@vinejs/vine'
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  uuidSchema,
  userRoleSchema,
  authProviderSchema,
  urlSchema,
  optionalUrlSchema,
} from './common_validators.js'

/* =====================================================
   VALIDATORS D'AUTHENTIFICATION
   ===================================================== */

/**
 * Schéma de validation pour la connexion
 */
export const loginSchema = vine.object({
  email: emailSchema,
  password: vine.string().minLength(1), // Pas de validation complexe pour la connexion
  rememberMe: vine.boolean().optional(),
})

/**
 * Schéma de validation pour l'inscription
 */
export const registerSchema = vine.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  username: vine
    .string()
    .trim()
    .minLength(3)
    .maxLength(255)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  fullName: vine.string().trim().maxLength(255).optional(),
  acceptTerms: vine.boolean(),
  
  // Champs optionnels pour l'inscription
  bio: vine.string().trim().maxLength(500).optional(),
  website: optionalUrlSchema,
  company: vine.string().trim().maxLength(255).optional(),
  location: vine.string().trim().maxLength(255).optional(),
  twitterHandle: vine
    .string()
    .trim()
    .maxLength(50)
    .regex(/^@?[a-zA-Z0-9_]+$/)
    .optional(),
  githubUsername: vine
    .string()
    .trim()
    .maxLength(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
    
  // Préférences par défaut
  preferredFramework: vine.enum(['html', 'react', 'vue', 'svelte', 'alpine', 'angular']).optional(),
  preferredCss: vine.enum(['tailwind_v3', 'tailwind_v4', 'vanilla_css']).optional(),
  darkModeDefault: vine.boolean().optional(),
})

/**
 * Schéma de validation pour la réinitialisation de mot de passe
 */
export const resetPasswordSchema = vine.object({
  email: emailSchema,
})

/**
 * Schéma de validation pour la confirmation de réinitialisation
 */
export const confirmResetPasswordSchema = vine.object({
  token: vine.string().minLength(1),
  password: passwordSchema,
  passwordConfirmation: vine.string().minLength(1),
})

/**
 * Schéma de validation pour le changement de mot de passe
 */
export const changePasswordSchema = vine.object({
  currentPassword: vine.string().minLength(1),
  newPassword: passwordSchema,
  newPasswordConfirmation: vine.string().minLength(1),
})

/**
 * Schéma de validation pour la vérification d'email
 */
export const verifyEmailSchema = vine.object({
  token: vine.string().minLength(1),
})

/* =====================================================
   VALIDATORS DE PROFIL UTILISATEUR
   ===================================================== */

/**
 * Schéma de validation pour la mise à jour du profil utilisateur
 */
export const updateUserSchema = vine.object({
  name: nameSchema.optional(),
  username: vine
    .string()
    .trim()
    .minLength(3)
    .maxLength(255)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  fullName: vine.string().trim().maxLength(255).optional(),
  bio: vine.string().trim().maxLength(500).optional(),
  website: optionalUrlSchema,
  company: vine.string().trim().maxLength(255).optional(),
  location: vine.string().trim().maxLength(255).optional(),
  twitterHandle: vine
    .string()
    .trim()
    .maxLength(50)
    .regex(/^@?[a-zA-Z0-9_]+$/)
    .optional(),
  githubUsername: vine
    .string()
    .trim()
    .maxLength(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
    
  // Préférences
  preferredFramework: vine.enum(['html', 'react', 'vue', 'svelte', 'alpine', 'angular']).optional(),
  preferredCss: vine.enum(['tailwind_v3', 'tailwind_v4', 'vanilla_css']).optional(),
  darkModeDefault: vine.boolean().optional(),
})

/**
 * Schéma de validation pour la mise à jour de l'avatar
 */
export const updateAvatarSchema = vine.object({
  avatarUrl: urlSchema.optional(),
  // Pour l'upload de fichier, la validation sera faite dans file_validators
})

/* =====================================================
   VALIDATORS D'ADMINISTRATION
   ===================================================== */

/**
 * Schéma de validation pour la création d'utilisateur par un admin
 */
export const createUserSchema = vine.object({
  email: emailSchema,
  password: passwordSchema.optional(), // Optionnel si invitation par email
  name: nameSchema,
  username: vine
    .string()
    .trim()
    .minLength(3)
    .maxLength(255)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  role: userRoleSchema.optional(),
  
  // Champs optionnels
  fullName: vine.string().trim().maxLength(255).optional(),
  bio: vine.string().trim().maxLength(500).optional(),
  website: optionalUrlSchema,
  company: vine.string().trim().maxLength(255).optional(),
  location: vine.string().trim().maxLength(255).optional(),
  
  // Envoi d'invitation
  sendInvitation: vine.boolean().optional(),
})

/**
 * Schéma de validation pour la mise à jour d'utilisateur par un admin
 */
export const adminUpdateUserSchema = vine.object({
  email: emailSchema.optional(),
  name: nameSchema.optional(),
  username: vine
    .string()
    .trim()
    .minLength(3)
    .maxLength(255)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  role: userRoleSchema.optional(),
  emailVerified: vine.boolean().optional(),
  
  // Champs de profil
  fullName: vine.string().trim().maxLength(255).optional(),
  bio: vine.string().trim().maxLength(500).optional(),
  website: optionalUrlSchema,
  company: vine.string().trim().maxLength(255).optional(),
  location: vine.string().trim().maxLength(255).optional(),
  twitterHandle: vine
    .string()
    .trim()
    .maxLength(50)
    .regex(/^@?[a-zA-Z0-9_]+$/)
    .optional(),
  githubUsername: vine
    .string()
    .trim()
    .maxLength(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
    
  // Actions administratives
  forcePasswordReset: vine.boolean().optional(),
  suspendAccount: vine.boolean().optional(),
})

/* =====================================================
   VALIDATORS DE TOKENS ET SESSIONS
   ===================================================== */

/**
 * Schéma de validation pour la création d'un token d'API
 */
export const createApiTokenSchema = vine.object({
  name: vine.string().trim().minLength(1).maxLength(100),
  scopes: vine.array(vine.string()).optional(),
  expiresAt: vine.date().optional(),
  rateLimitPerHour: vine.number().min(1).max(10000).optional(),
})

/**
 * Schéma de validation pour la révocation d'un token
 */
export const revokeTokenSchema = vine.object({
  tokenId: uuidSchema,
  reason: vine.string().trim().maxLength(255).optional(),
})

/* =====================================================
   VALIDATORS D'AUTHENTIFICATION SOCIALE
   ===================================================== */

/**
 * Schéma de validation pour l'authentification OAuth
 */
export const oauthCallbackSchema = vine.object({
  code: vine.string().minLength(1),
  state: vine.string().minLength(1).optional(),
  provider: authProviderSchema,
})

/**
 * Schéma de validation pour lier un compte social
 */
export const linkSocialAccountSchema = vine.object({
  provider: authProviderSchema,
  providerId: vine.string().minLength(1),
  accessToken: vine.string().minLength(1).optional(),
})

/* =====================================================
   VALIDATORS DE RECHERCHE ET FILTRAGE
   ===================================================== */

/**
 * Schéma de validation pour la recherche d'utilisateurs (admin)
 */
export const searchUsersSchema = vine.object({
  q: vine.string().trim().minLength(1).maxLength(255).optional(),
  role: userRoleSchema.optional(),
  emailVerified: vine.boolean().optional(),
  provider: authProviderSchema.optional(),
  isActive: vine.boolean().optional(),
  
  // Pagination et tri
  page: vine.number().min(1).optional(),
  limit: vine.number().min(1).max(100).optional(),
  sortBy: vine.enum(['createdAt', 'updatedAt', 'lastLoginAt', 'name', 'email']).optional(),
  sortOrder: vine.enum(['asc', 'desc']).optional(),
})

/* =====================================================
   VALIDATORS DE VALIDATION D'EMAIL ET INVITATIONS
   ===================================================== */

/**
 * Schéma de validation pour renvoyer un email de vérification
 */
export const resendVerificationSchema = vine.object({
  email: emailSchema,
})

/**
 * Schéma de validation pour inviter un utilisateur
 */
export const inviteUserSchema = vine.object({
  email: emailSchema,
  role: userRoleSchema.optional(),
  message: vine.string().trim().maxLength(500).optional(),
})

/**
 * Schéma de validation pour accepter une invitation
 */
export const acceptInvitationSchema = vine.object({
  token: vine.string().minLength(1),
  password: passwordSchema,
  name: nameSchema,
  username: vine
    .string()
    .trim()
    .minLength(3)
    .maxLength(255)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  acceptTerms: vine.boolean(),
})