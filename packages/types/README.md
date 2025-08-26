# @workspace/types

Package de types TypeScript partagés pour l'application Ona UI.

## Description

Ce package contient tous les types TypeScript nécessaires pour le MVP d'Ona UI, basés sur le schéma de base de données existant. Les types sont organisés par domaine pour faciliter l'importation et la maintenance.

## Structure

```
src/
├── index.ts          # Exports principaux
├── common.ts         # Types communs et enums
├── auth.ts           # Types d'authentification et utilisateurs
├── categories.ts     # Types pour produits, catégories et sous-catégories
├── components.ts     # Types pour composants et versions
└── api.ts           # Types pour requêtes/réponses API
```

## Installation

Ce package fait partie du monorepo et est automatiquement disponible via les workspaces Yarn.

```bash
# Dans un autre package du monorepo
yarn add @workspace/types
```

## Utilisation

### Import principal

```typescript
import type { 
  User, 
  Component, 
  Category, 
  APIResponse 
} from '@workspace/types';
```

### Imports spécifiques par domaine

```typescript
// Types d'authentification
import type { 
  LoginRequest, 
  RegisterData, 
  AuthResponse 
} from '@workspace/types/auth';

// Types de composants
import type { 
  PublicComponent, 
  ComponentFilters, 
  GetComponentsResponse 
} from '@workspace/types/components';

// Types d'API
import type { 
  APIResponse, 
  GetComponentsRequest 
} from '@workspace/types/api';

// Types communs
import type { 
  UserRole, 
  ComponentStatus, 
  FrameworkType 
} from '@workspace/types/common';
```

### Constantes utiles

```typescript
import { 
  DEFAULT_VALUES, 
  ENUM_VALUES, 
  CONSTRAINTS 
} from '@workspace/types';

// Utilisation des valeurs par défaut
const defaultRole = DEFAULT_VALUES.USER_ROLE; // "user"
const defaultFramework = DEFAULT_VALUES.FRAMEWORK_TYPE; // "react"

// Validation avec les enums
const isValidRole = ENUM_VALUES.USER_ROLES.includes(role);

// Contraintes de validation
const isValidEmail = email.length <= CONSTRAINTS.EMAIL_MAX_LENGTH;
```

## Types principaux

### Authentification (`auth.ts`)

- `User` - Utilisateur complet
- `PublicUser` - Données publiques d'un utilisateur
- `UserProfile` - Profil utilisateur avec statistiques
- `License` - Licence utilisateur
- `APIKey` - Clé API
- `AuthResponse` - Réponse d'authentification

### Composants (`components.ts`)

- `Component` - Composant de base
- `PublicComponent` - Composant pour affichage public
- `FullComponent` - Composant avec toutes les relations
- `ComponentVersion` - Version d'un composant
- `ComponentRequest` - Demande de composant

### Catégories (`categories.ts`)

- `Product` - Produit (niveau le plus haut)
- `Category` - Catégorie de composants
- `Subcategory` - Sous-catégorie
- `NavigationStructure` - Structure de navigation

### API (`api.ts`)

- `APIResponse<T>` - Réponse API générique
- `APIPaginatedResponse<T>` - Réponse paginée
- `LoginRequest/Response` - Authentification
- `GetComponentsRequest/Response` - Liste des composants
- Et tous les autres endpoints...

### Communs (`common.ts`)

- Enums : `UserRole`, `ComponentStatus`, `FrameworkType`, etc.
- Types utilitaires : `UUID`, `Timestamp`, `PaginationParams`, etc.
- Interfaces de configuration : `ComponentDependencies`, `ComponentConfig`, etc.

## Enums disponibles

```typescript
// Rôles utilisateur
type UserRole = "user" | "admin" | "super_admin";

// Statuts des composants
type ComponentStatus = "draft" | "published" | "archived" | "deprecated";

// Types de frameworks
type FrameworkType = "html" | "react" | "vue" | "svelte" | "alpine" | "angular";

// Frameworks CSS
type CssFramework = "tailwind_v3" | "tailwind_v4" | "vanilla_css";

// Niveaux de licence
type LicenseTier = "free" | "pro" | "team" | "enterprise";

// Types d'accès
type AccessType = "preview_only" | "copy" | "full_access" | "download";
```

## Compatibilité

- Compatible avec le schéma Drizzle existant
- Types stricts et bien documentés
- Support du système de versioning automatique
- Protection du code premium intégrée
- Prêt pour l'utilisation avec AdonisJS et Next.js

## Développement

```bash
# Compilation
yarn build

# Mode watch
yarn dev

# Vérification des types
yarn type-check

# Linting
yarn lint
```

## Contribution

Lors de l'ajout de nouveaux types :

1. Placez-les dans le fichier approprié selon le domaine
2. Ajoutez la documentation JSDoc
3. Exportez-les dans `index.ts`
4. Mettez à jour ce README si nécessaire
5. Assurez-vous que les types sont compatibles avec le schéma de base de données

## Notes importantes

- **Pas de logique métier** : Ce package contient uniquement des définitions de types
- **Types stricts** : Tous les types sont strictement typés pour éviter les erreurs
- **Compatibilité Drizzle** : Les types sont compatibles avec le schéma Drizzle existant
- **Versioning** : Les types supportent le système de versioning automatique des composants
- **Sécurité** : Les types incluent la protection du code premium et les permissions