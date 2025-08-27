#!/usr/bin/env node

/**
 * Configuration validation script
 * Checks that all necessary environment variables are configured
 * for the proper functioning of payment and authentication flows
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

interface ConfigCheck {
  name: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  example?: string;
}

const CONFIG_CHECKS: ConfigCheck[] = [
  // Database
  {
    name: 'DB_HOST',
    required: true,
    description: 'PostgreSQL database host',
    example: 'localhost'
  },
  {
    name: 'DB_PORT',
    required: true,
    description: 'PostgreSQL database port',
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0,
    example: '5432'
  },
  {
    name: 'DB_USER',
    required: true,
    description: 'Database user',
    example: 'postgres'
  },
  {
    name: 'DB_PASSWORD',
    required: true,
    description: 'Database password',
    example: 'password'
  },
  {
    name: 'DB_DATABASE',
    required: true,
    description: 'Database name',
    example: 'ona_ui'
  },

  // Stripe
  {
    name: 'STRIPE_SECRET_KEY',
    required: true,
    description: 'Stripe secret key for payments',
    validator: (value) => value.startsWith('sk_'),
    example: 'sk_test_...'
  },
  {
    name: 'STRIPE_PUBLISHABLE_KEY',
    required: true,
    description: 'Stripe public key for frontend',
    validator: (value) => value.startsWith('pk_'),
    example: 'pk_test_...'
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    description: 'Stripe webhook secret for signature verification',
    validator: (value) => value.startsWith('whsec_'),
    example: 'whsec_...'
  },

  // Email (Brevo)
  {
    name: 'BREVO_API_KEY',
    required: true,
    description: 'Brevo API key for sending emails',
    example: 'xkeysib-...'
  },

  // Better Auth
  {
    name: 'BETTER_AUTH_SECRET',
    required: true,
    description: 'Secret for Better Auth (token generation)',
    validator: (value) => value.length >= 32,
    example: 'your-32-character-secret-key-here'
  },
  {
    name: 'BETTER_AUTH_URL',
    required: true,
    description: 'Base URL for Better Auth',
    validator: (value) => value.startsWith('http'),
    example: 'http://localhost:3333'
  },

  // Application
  {
    name: 'APP_KEY',
    required: true,
    description: 'AdonisJS application encryption key',
    validator: (value) => value.length >= 32,
    example: 'your-app-key-here'
  },
  {
    name: 'APP_URL',
    required: false,
    description: 'Application base URL',
    validator: (value) => value.startsWith('http'),
    example: 'http://localhost:3000'
  },
  {
    name: 'NODE_ENV',
    required: false,
    description: 'Runtime environment',
    validator: (value) => ['development', 'production', 'test'].includes(value),
    example: 'development'
  }
];

interface ValidationResult {
  name: string;
  status: 'ok' | 'missing' | 'invalid';
  value?: string;
  message?: string;
}

class ConfigValidator {
  private results: ValidationResult[] = [];

  validate(): void {
    console.log('🔍 Validating configuration...\n');

    for (const check of CONFIG_CHECKS) {
      const result = this.validateConfig(check);
      this.results.push(result);
      this.printResult(result, check);
    }

    this.printSummary();
  }

  private validateConfig(check: ConfigCheck): ValidationResult {
    const value = process.env[check.name];

    if (!value) {
      return {
        name: check.name,
        status: check.required ? 'missing' : 'ok',
        message: check.required ? 'Missing variable' : 'Optional variable not defined'
      };
    }

    if (check.validator && !check.validator(value)) {
      return {
        name: check.name,
        status: 'invalid',
        value: this.maskSensitiveValue(check.name, value),
        message: 'Invalid format'
      };
    }

    return {
      name: check.name,
      status: 'ok',
      value: this.maskSensitiveValue(check.name, value)
    };
  }

  private maskSensitiveValue(name: string, value: string): string {
    const sensitiveKeys = ['SECRET', 'KEY', 'PASSWORD', 'TOKEN'];
    
    if (sensitiveKeys.some(key => name.includes(key))) {
      if (value.length <= 8) {
        return '*'.repeat(value.length);
      }
      return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
    }

    return value;
  }

  private printResult(result: ValidationResult, check: ConfigCheck): void {
    const icon = result.status === 'ok' ? '✅' : result.status === 'missing' ? '❌' : '⚠️';
    const status = result.status === 'ok' ? 'OK' : result.status === 'missing' ? 'MISSING' : 'INVALID';

    console.log(`${icon} ${result.name.padEnd(25)} ${status.padEnd(10)} ${result.value || ''}`);

    if (result.message) {
      console.log(`   └─ ${result.message}`);
    }

    if (result.status !== 'ok') {
      console.log(`   └─ ${check.description}`);
      if (check.example) {
        console.log(`   └─ Example: ${check.example}`);
      }
    }

    console.log();
  }

  private printSummary(): void {
    const total = this.results.length;
    const ok = this.results.filter(r => r.status === 'ok').length;
    const missing = this.results.filter(r => r.status === 'missing').length;
    const invalid = this.results.filter(r => r.status === 'invalid').length;

    console.log('📊 Validation summary:');
    console.log(`   Total: ${total}`);
    console.log(`   ✅ OK: ${ok}`);
    console.log(`   ❌ Missing: ${missing}`);
    console.log(`   ⚠️  Invalid: ${invalid}`);
    console.log();

    if (missing > 0 || invalid > 0) {
      console.log('❌ Configuration incomplete or invalid!');
      console.log('   Please fix the errors before continuing.');
      process.exit(1);
    } else {
      console.log('✅ Configuration valid!');
      console.log('   All services can be started.');
    }
  }

  getResults(): ValidationResult[] {
    return this.results;
  }
}

// Function to test connections to external services
class ServiceConnectivityTester {
  async testConnections(): Promise<void> {
    console.log('\n🔗 Testing connectivity to external services...\n');

    await this.testDatabase();
    await this.testStripe();
    await this.testBrevo();
  }

  private async testDatabase(): Promise<void> {
    try {
      console.log('🗄️  Testing database connection...');

      // Dynamic import to avoid errors if config is not ready
      const { Client } = await import('pg');

      const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        connectionTimeoutMillis: 5000,
      });

      await client.connect();
      const result = await client.query('SELECT NOW()');
      await client.end();

      console.log('✅ Database: Connection successful');
      console.log(`   └─ Timestamp: ${result.rows[0].now}\n`);
    } catch (error) {
      console.log('❌ Database: Connection failed');
      console.log(`   └─ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }

  private async testStripe(): Promise<void> {
    try {
      console.log('💳 Testing Stripe connection...');

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-08-27.basil',
        timeout: 5000,
      });

      const account = await stripe.accounts.retrieve();

      console.log('✅ Stripe: Connection successful');
      console.log(`   └─ Account: ${account.id} (${account.country})\n`);
    } catch (error) {
      console.log('❌ Stripe: Connection failed');
      console.log(`   └─ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }

  private async testBrevo(): Promise<void> {
    try {
      console.log('📧 Testing Brevo connection...');

      const { TransactionalEmailsApi } = await import('@getbrevo/brevo');
      const emailAPI = new TransactionalEmailsApi();
      (emailAPI as any).authentications.apiKey.apiKey = process.env.BREVO_API_KEY;

      // Simple test: retrieve account information
      const response = await fetch('https://api.brevo.com/v3/account', {
        headers: {
          'api-key': process.env.BREVO_API_KEY!,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const account = await response.json() as { email: string };
        console.log('✅ Brevo: Connection successful');
        console.log(`   └─ Email: ${account.email}\n`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log('❌ Brevo: Connection failed');
      console.log(`   └─ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }
}

// Main function
async function main(): Promise<void> {
  console.log('🚀 Ona UI configuration validation\n');
  console.log('=' .repeat(60));

  // Check that .env file exists
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    console.log('❌ .env file not found!');
    console.log(`   Expected path: ${envPath}`);
    console.log('   Create a .env file based on .env.example');
    process.exit(1);
  }

  // Validate the configuration
  const validator = new ConfigValidator();
  validator.validate();

  // Test connections if configuration is valid
  const results = validator.getResults();
  const hasErrors = results.some(r => r.status === 'missing' || r.status === 'invalid');

  if (!hasErrors) {
    const tester = new ServiceConnectivityTester();
    await tester.testConnections();
  }

  console.log('🎯 Validation completed!');
}

// Execute the script if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error during validation:', error);
    process.exit(1);
  });
}

export { ConfigValidator, ServiceConnectivityTester };