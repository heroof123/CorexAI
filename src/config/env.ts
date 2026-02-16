// Environment Variables Validation

interface EnvConfig {
  // OAuth
  githubClientId?: string;
  githubClientSecret?: string;
  microsoftClientId?: string;
  microsoftClientSecret?: string;
  
  // App
  isDev: boolean;
  isProduction: boolean;
}

/**
 * Validate required environment variables
 * Throws error if any required variable is missing
 */
export function validateEnv(): void {
  const requiredVars: string[] = [];
  const optionalVars = [
    'VITE_GITHUB_CLIENT_ID',
    'VITE_GITHUB_CLIENT_SECRET',
    'VITE_MICROSOFT_CLIENT_ID',
    'VITE_MICROSOFT_CLIENT_SECRET'
  ];
  
  const missing: string[] = [];
  
  // Check required variables
  for (const key of requiredVars) {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    const errorMessage = `
❌ Missing required environment variables:

${missing.map(key => `  • ${key}`).join('\n')}

Please create a .env file in the project root with these variables.
See .env.example for reference.
    `.trim();
    
    throw new Error(errorMessage);
  }
  
  // Warn about missing optional variables
  const missingOptional: string[] = [];
  for (const key of optionalVars) {
    if (!import.meta.env[key]) {
      missingOptional.push(key);
    }
  }
  
  if (missingOptional.length > 0 && import.meta.env.DEV) {
    console.warn('⚠️ Missing optional environment variables:');
    missingOptional.forEach(key => {
      console.warn(`  • ${key}`);
    });
    console.warn('\nSome features may not work without these variables.');
    console.warn('See .env.example for reference.\n');
  }
}

/**
 * Get typed environment configuration
 */
export function getEnvConfig(): EnvConfig {
  return {
    // OAuth
    githubClientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
    githubClientSecret: import.meta.env.VITE_GITHUB_CLIENT_SECRET,
    microsoftClientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    microsoftClientSecret: import.meta.env.VITE_MICROSOFT_CLIENT_SECRET,
    
    // App
    isDev: import.meta.env.DEV,
    isProduction: import.meta.env.PROD
  };
}

/**
 * Check if OAuth is configured
 */
export function isOAuthConfigured(provider: 'github' | 'microsoft'): boolean {
  const config = getEnvConfig();
  
  if (provider === 'github') {
    return !!(config.githubClientId && config.githubClientSecret);
  }
  
  if (provider === 'microsoft') {
    return !!(config.microsoftClientId && config.microsoftClientSecret);
  }
  
  return false;
}

/**
 * Get missing OAuth configuration
 */
export function getMissingOAuthConfig(): string[] {
  const missing: string[] = [];
  const config = getEnvConfig();
  
  if (!config.githubClientId) missing.push('VITE_GITHUB_CLIENT_ID');
  if (!config.githubClientSecret) missing.push('VITE_GITHUB_CLIENT_SECRET');
  if (!config.microsoftClientId) missing.push('VITE_MICROSOFT_CLIENT_ID');
  if (!config.microsoftClientSecret) missing.push('VITE_MICROSOFT_CLIENT_SECRET');
  
  return missing;
}

// Export for use in components
export const env = getEnvConfig();
