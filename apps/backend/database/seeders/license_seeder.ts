import { BaseSeeder } from './base_seeder.js'
import { licenses, licenseTeamMembers } from '../../app/db/schema.js'

/**
 * Seeder pour les licences et membres d'équipe
 */
export class LicenseSeeder extends BaseSeeder {
  async run(): Promise<void> {
    this.log('Début du seeding des licences...')

    try {
      // Récupérer les IDs des utilisateurs
      const seederData = (global as any).seederData
      if (!seederData?.userIds) {
        throw new Error('Les utilisateurs doivent être créés avant les licences')
      }

      // Vérifier si des licences existent déjà
      const existingLicenses = await this.checkExistingData(licenses)
      
      if (existingLicenses) {
        this.log('Des licences existent déjà, nettoyage...')
        await this.truncateTable(licenseTeamMembers, 'license_team_members')
        await this.truncateTable(licenses, 'licenses')
      }

      // Données des licences
      const licenseData = [
        // Licence Pro pour l'utilisateur pro
        {
          id: this.helpers.generateUuid(),
          userId: seederData.proUserId,
          licenseKey: this.helpers.generateLicenseKey(),
          tier: 'pro' as const,
          stripePaymentId: 'pi_test_pro_' + this.helpers.randomInt(100000, 999999),
          stripeCustomerId: 'cus_test_pro_' + this.helpers.randomInt(100000, 999999),
          stripeInvoiceId: 'in_test_pro_' + this.helpers.randomInt(100000, 999999),
          amountPaid: 14900, // 149€
          currency: 'EUR',
          paymentStatus: 'completed' as const,
          seatsAllowed: 1,
          seatsUsed: 1,
          validFrom: this.helpers.randomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date()),
          isLifetime: true,
          isActive: true,
          isEarlyBird: true,
          discountPercentage: 20,
          discountCode: 'EARLY20',
          notes: 'Licence Pro - Early Bird',
          ...this.generateTimestamps()
        },

        // Licence Team pour l'utilisateur team
        {
          id: this.helpers.generateUuid(),
          userId: seederData.teamUserId,
          licenseKey: this.helpers.generateLicenseKey(),
          tier: 'team' as const,
          stripePaymentId: 'pi_test_team_' + this.helpers.randomInt(100000, 999999),
          stripeCustomerId: 'cus_test_team_' + this.helpers.randomInt(100000, 999999),
          stripeInvoiceId: 'in_test_team_' + this.helpers.randomInt(100000, 999999),
          amountPaid: 49900, // 499€
          currency: 'EUR',
          paymentStatus: 'completed' as const,
          seatsAllowed: 5,
          seatsUsed: 3,
          validFrom: this.helpers.randomDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), new Date()),
          isLifetime: true,
          isActive: true,
          isEarlyBird: false,
          discountPercentage: 0,
          notes: 'Licence Team - 5 sièges',
          ...this.generateTimestamps()
        },

        // Licence Enterprise (exemple)
        {
          id: this.helpers.generateUuid(),
          userId: seederData.userIds[5], // dev1
          licenseKey: this.helpers.generateLicenseKey(),
          tier: 'enterprise' as const,
          stripePaymentId: 'pi_test_ent_' + this.helpers.randomInt(100000, 999999),
          stripeCustomerId: 'cus_test_ent_' + this.helpers.randomInt(100000, 999999),
          stripeInvoiceId: 'in_test_ent_' + this.helpers.randomInt(100000, 999999),
          amountPaid: 99900, // 999€
          currency: 'EUR',
          paymentStatus: 'completed' as const,
          seatsAllowed: 20,
          seatsUsed: 8,
          validFrom: this.helpers.randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
          isLifetime: true,
          isActive: true,
          isEarlyBird: false,
          discountPercentage: 0,
          notes: 'Licence Enterprise - 20 sièges',
          ...this.generateTimestamps()
        },

        // Licence Pro expirée (pour tester les cas d'expiration)
        {
          id: this.helpers.generateUuid(),
          userId: seederData.userIds[6], // dev2
          licenseKey: this.helpers.generateLicenseKey(),
          tier: 'pro' as const,
          stripePaymentId: 'pi_test_exp_' + this.helpers.randomInt(100000, 999999),
          stripeCustomerId: 'cus_test_exp_' + this.helpers.randomInt(100000, 999999),
          stripeInvoiceId: 'in_test_exp_' + this.helpers.randomInt(100000, 999999),
          amountPaid: 14900,
          currency: 'EUR',
          paymentStatus: 'completed' as const,
          seatsAllowed: 1,
          seatsUsed: 1,
          validFrom: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // Il y a 400 jours
          validUntil: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Expirée il y a 30 jours
          isLifetime: false,
          isActive: false,
          isEarlyBird: false,
          discountPercentage: 0,
          notes: 'Licence Pro expirée - pour tests',
          ...this.generateTimestamps()
        },

        // Licence en attente de paiement
        {
          id: this.helpers.generateUuid(),
          userId: seederData.userIds[4], // Un autre utilisateur
          licenseKey: this.helpers.generateLicenseKey(),
          tier: 'pro' as const,
          stripePaymentId: 'pi_test_pending_' + this.helpers.randomInt(100000, 999999),
          stripeCustomerId: 'cus_test_pending_' + this.helpers.randomInt(100000, 999999),
          amountPaid: 14900,
          currency: 'EUR',
          paymentStatus: 'pending' as const,
          seatsAllowed: 1,
          seatsUsed: 0,
          validFrom: new Date(),
          isLifetime: true,
          isActive: false,
          isEarlyBird: false,
          discountPercentage: 0,
          notes: 'Licence en attente de paiement',
          ...this.generateTimestamps()
        }
      ]

      // Insertion des licences
      await this.batchInsert(licenses, licenseData, 10, 'licenses')

      this.log(`✅ ${licenseData.length} licences créées avec succès`)

      // Créer les membres d'équipe pour la licence Team
      const teamLicenseId = licenseData[1].id // Licence Team
      const teamMembersData = [
        // Propriétaire de la licence
        {
          id: this.helpers.generateUuid(),
          licenseId: teamLicenseId,
          userId: seederData.teamUserId,
          invitedBy: null,
          role: 'owner',
          joinedAt: licenseData[1].validFrom
        },
        // Membres invités
        {
          id: this.helpers.generateUuid(),
          licenseId: teamLicenseId,
          userId: seederData.userIds[5], // dev1
          invitedBy: seederData.teamUserId,
          role: 'admin',
          joinedAt: this.helpers.randomDate(licenseData[1].validFrom, new Date())
        },
        {
          id: this.helpers.generateUuid(),
          licenseId: teamLicenseId,
          userId: seederData.userIds[6], // dev2
          invitedBy: seederData.teamUserId,
          role: 'member',
          joinedAt: this.helpers.randomDate(licenseData[1].validFrom, new Date())
        }
      ]

      // Insertion des membres d'équipe
      await this.batchInsert(licenseTeamMembers, teamMembersData, 10, 'license_team_members')

      this.log(`✅ ${teamMembersData.length} membres d'équipe créés avec succès`)

      // Stocker les IDs pour les autres seeders
      ;(global as any).seederData.licenseIds = licenseData.map(l => l.id)
      ;(global as any).seederData.proLicenseId = licenseData[0].id
      ;(global as any).seederData.teamLicenseId = licenseData[1].id
      ;(global as any).seederData.enterpriseLicenseId = licenseData[2].id

      this.log('IDs des licences stockés pour les autres seeders')

    } catch (error) {
      this.handleError(error, 'run()')
    }
  }
}