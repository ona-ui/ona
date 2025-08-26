import { BaseSeeder } from './base_seeder.js'
import { users } from '../../app/db/schema.js'

/**
 * Seeder pour les utilisateurs de test
 */
export class UserSeeder extends BaseSeeder {
  async run(): Promise<void> {
    this.log('Début du seeding des utilisateurs...')

    try {
      // Vérifier si des utilisateurs existent déjà
      const existingUsers = await this.checkExistingData(users)
      
      if (existingUsers) {
        this.log('Des utilisateurs existent déjà, nettoyage...')
        await this.truncateTable(users, 'users')
      }

      // Utilisateurs de test avec différents rôles et tiers
      const userData = [
        // Super Admin
        {
          id: this.helpers.generateUuid(),
          email: this.helpers.generateTestEmail('admin'),
          name: 'Admin Super',
          username: 'admin',
          fullName: 'Administrateur Super Utilisateur',
          role: 'super_admin' as const,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          passwordHash: await this.helpers.hashPassword('admin123'),
          provider: 'email' as const,
          bio: 'Super administrateur du système Ona UI',
          company: 'Ona UI',
          location: 'Paris, France',
          preferredFramework: 'react' as const,
          preferredCss: 'tailwind_v4' as const,
          darkModeDefault: true,
          lastLoginAt: new Date(),
          ...this.generateTimestamps()
        },

        // Admin Standard
        {
          id: this.helpers.generateUuid(),
          email: this.helpers.generateTestEmail('editor'),
          name: 'Editor Admin',
          username: 'editor',
          fullName: 'Éditeur Administrateur',
          role: 'admin' as const,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          passwordHash: await this.helpers.hashPassword('editor123'),
          provider: 'email' as const,
          bio: 'Administrateur en charge de la gestion des composants',
          company: 'Ona UI',
          location: 'Lyon, France',
          preferredFramework: 'vue' as const,
          preferredCss: 'tailwind_v4' as const,
          darkModeDefault: false,
          lastLoginAt: new Date(),
          ...this.generateTimestamps()
        },

        // Utilisateur Pro
        {
          id: this.helpers.generateUuid(),
          email: this.helpers.generateTestEmail('pro'),
          name: 'Pro User',
          username: 'pro_user',
          fullName: 'Utilisateur Professionnel',
          role: 'user' as const,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          passwordHash: await this.helpers.hashPassword('pro123'),
          provider: 'email' as const,
          bio: 'Développeur freelance spécialisé en React',
          company: 'Freelance',
          location: 'Marseille, France',
          website: 'https://pro-dev.example.com',
          twitterHandle: 'prodev',
          githubUsername: 'prodev',
          preferredFramework: 'react' as const,
          preferredCss: 'tailwind_v4' as const,
          darkModeDefault: true,
          lastLoginAt: this.helpers.randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()),
          ...this.generateTimestamps()
        },

        // Utilisateur Team
        {
          id: this.helpers.generateUuid(),
          email: this.helpers.generateTestEmail('team'),
          name: 'Team Lead',
          username: 'team_lead',
          fullName: 'Chef d\'Équipe Technique',
          role: 'user' as const,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          passwordHash: await this.helpers.hashPassword('team123'),
          provider: 'email' as const,
          bio: 'Lead développeur dans une startup en croissance',
          company: 'TechStartup Inc.',
          location: 'Bordeaux, France',
          website: 'https://techstartup.example.com',
          twitterHandle: 'teamlead',
          githubUsername: 'teamlead',
          preferredFramework: 'svelte' as const,
          preferredCss: 'tailwind_v3' as const,
          darkModeDefault: true,
          lastLoginAt: this.helpers.randomDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), new Date()),
          ...this.generateTimestamps()
        },

        // Utilisateur Gratuit
        {
          id: this.helpers.generateUuid(),
          email: this.helpers.generateTestEmail('free'),
          name: 'Free User',
          username: 'free_user',
          fullName: 'Utilisateur Gratuit',
          role: 'user' as const,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          passwordHash: await this.helpers.hashPassword('free123'),
          provider: 'email' as const,
          bio: 'Étudiant en développement web',
          company: 'École 42',
          location: 'Toulouse, France',
          githubUsername: 'freeuser',
          preferredFramework: 'html' as const,
          preferredCss: 'vanilla_css' as const,
          darkModeDefault: false,
          lastLoginAt: this.helpers.randomDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), new Date()),
          ...this.generateTimestamps()
        },

        // Utilisateurs supplémentaires pour les tests
        {
          id: this.helpers.generateUuid(),
          email: this.helpers.generateTestEmail('dev1'),
          name: 'Dev One',
          username: 'dev_one',
          fullName: 'Développeur Un',
          role: 'user' as const,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          passwordHash: await this.helpers.hashPassword('dev123'),
          provider: 'email' as const,
          bio: 'Développeur frontend passionné',
          company: 'WebAgency',
          location: 'Nantes, France',
          preferredFramework: 'angular' as const,
          preferredCss: 'tailwind_v4' as const,
          darkModeDefault: true,
          lastLoginAt: this.helpers.randomDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), new Date()),
          ...this.generateTimestamps()
        },

        {
          id: this.helpers.generateUuid(),
          email: this.helpers.generateTestEmail('dev2'),
          name: 'Dev Two',
          username: 'dev_two',
          fullName: 'Développeur Deux',
          role: 'user' as const,
          emailVerified: false,
          passwordHash: await this.helpers.hashPassword('dev123'),
          provider: 'github' as const,
          providerId: 'github_123456',
          bio: 'Full-stack developer',
          company: 'StartupCorp',
          location: 'Lille, France',
          githubUsername: 'devtwo',
          preferredFramework: 'vue' as const,
          preferredCss: 'tailwind_v3' as const,
          darkModeDefault: false,
          lastLoginAt: this.helpers.randomDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), new Date()),
          ...this.generateTimestamps()
        }
      ]

      // Insertion des utilisateurs
      await this.batchInsert(users, userData, 10, 'users')

      this.log(`✅ ${userData.length} utilisateurs créés avec succès`)

      // Stocker les IDs pour les autres seeders
      ;(global as any).seederData = (global as any).seederData || {}
      ;(global as any).seederData.userIds = userData.map(u => u.id)
      ;(global as any).seederData.adminUserId = userData[0].id // Super admin
      ;(global as any).seederData.editorUserId = userData[1].id // Admin standard
      ;(global as any).seederData.proUserId = userData[2].id // Pro user
      ;(global as any).seederData.teamUserId = userData[3].id // Team user
      ;(global as any).seederData.freeUserId = userData[4].id // Free user

      this.log('IDs des utilisateurs stockés pour les autres seeders')

    } catch (error) {
      this.handleError(error, 'run()')
    }
  }
}