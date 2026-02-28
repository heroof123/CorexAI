// Adaptive Autonomy System
// Model gücüne göre tool otomasyonu

export type AutonomyLevel = 1 | 2 | 3 | 4 | 5;

export interface ModelCapabilities {
  contextSize: number;
  parameters?: number; // Billion parameters (e.g., 7 for 7B)
  modelName: string;
  isLocal: boolean;
}

export interface AutonomyConfig {
  level: AutonomyLevel;
  autoApproveTools: string[]; // Tool names that are always auto-approved
  requireApprovalTools: string[]; // Tool names that always require approval
  dangerousCommands: string[]; // Commands that are considered dangerous
}

// Default autonomy configuration
const DEFAULT_CONFIG: AutonomyConfig = {
  level: 3, // Balanced default
  autoApproveTools: [
    'read_file', 'list_files', 'plan_task',
    'deep_search_project', 'get_project_map',
    'retrieve_knowledge'
  ], // Safe tools
  requireApprovalTools: ['write_file', 'run_terminal', 'scaffold_module', 'fix_terminal_error'], // Potentially destructive
  dangerousCommands: [
    'rm ', 'del ', 'format', 'rmdir', 'rd ',
    'shutdown', 'reboot', 'kill',
    'DROP TABLE', 'DELETE FROM',
    'npm uninstall', 'yarn remove'
  ]
};

/**
 * Autonomy Levels:
 * 
 * Level 1 - Chat Only
 * - No tool execution
 * - AI can only chat
 * 
 * Level 2 - Suggestions
 * - AI suggests tools but doesn't execute
 * - User must manually approve each tool
 * 
 * Level 3 - Tool Proposals (Default)
 * - AI can propose tools
 * - Safe tools auto-execute
 * - Dangerous tools require approval
 * 
 * Level 4 - Auto Tools
 * - Most tools auto-execute
 * - Only dangerous commands require approval
 * 
 * Level 5 - Autonomous
 * - All tools auto-execute
 * - No approval required (use with caution!)
 */

/**
 * Determine autonomy level based on model capabilities
 */
export function determineAutonomyLevel(capabilities: ModelCapabilities): AutonomyLevel {
  const { contextSize, parameters } = capabilities;

  // Small models (< 3B params or < 8K context) - Level 2
  if ((parameters && parameters < 3) || contextSize < 8192) {
    return 2;
  }

  // Medium models (3-7B params, 8-32K context) - Level 3
  if ((parameters && parameters < 7) || contextSize < 32768) {
    return 3;
  }

  // Large models (7-13B params, 32K+ context) - Level 4
  if ((parameters && parameters < 13) || contextSize < 65536) {
    return 4;
  }

  // Very large models (13B+ params, 64K+ context) - Level 5
  // But only if user explicitly enables it
  return 4; // Default to Level 4 for safety
}

/**
 * Check if a tool requires approval based on autonomy level
 */
export function requiresApproval(
  toolName: string,
  parameters: any,
  config: AutonomyConfig
): boolean {
  const { level, autoApproveTools, requireApprovalTools, dangerousCommands } = config;

  // Level 1: No tools allowed
  if (level === 1) {
    return true; // Block all tools
  }

  // Level 2: All tools require approval
  if (level === 2) {
    return true;
  }

  // Check if tool is in always-require list
  if (requireApprovalTools.includes(toolName)) {
    return true;
  }

  // Check if tool is in auto-approve list
  if (autoApproveTools.includes(toolName)) {
    return false;
  }

  // Level 5: Auto-approve everything (dangerous!)
  if (level === 5) {
    return false;
  }

  // Check for dangerous commands in terminal
  if (toolName === 'run_terminal' && parameters.command) {
    const command = parameters.command.toLowerCase();
    const isDangerous = dangerousCommands.some(dangerous =>
      command.includes(dangerous.toLowerCase())
    );

    if (isDangerous) {
      return true; // Always require approval for dangerous commands
    }
  }

  // Level 3: Safe tools auto, others require approval
  if (level === 3) {
    return !['read_file', 'list_files', 'plan_task', 'generate_code'].includes(toolName);
  }

  // Level 4: Most tools auto, only dangerous require approval
  if (level === 4) {
    return false; // Auto-approve unless caught by dangerous check above
  }

  return true; // Default: require approval
}

/**
 * Get autonomy configuration from localStorage
 */
export function getAutonomyConfig(): AutonomyConfig {
  try {
    const saved = localStorage.getItem('corex-autonomy-config');
    if (saved) {
      const config = JSON.parse(saved);
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch (error) {
    console.error('Failed to load autonomy config:', error);
  }
  return DEFAULT_CONFIG;
}

/**
 * Save autonomy configuration to localStorage
 */
export function saveAutonomyConfig(config: Partial<AutonomyConfig>): void {
  try {
    const current = getAutonomyConfig();
    const updated = { ...current, ...config };
    localStorage.setItem('corex-autonomy-config', JSON.stringify(updated));
    console.log('✅ Autonomy config saved:', updated);
  } catch (error) {
    console.error('Failed to save autonomy config:', error);
  }
}

/**
 * Get autonomy level description
 */
export function getAutonomyLevelDescription(level: AutonomyLevel): string {
  switch (level) {
    case 1:
      return '🔒 Chat Only - No tool execution';
    case 2:
      return '💬 Suggestions - Manual approval for all tools';
    case 3:
      return '⚖️ Balanced - Safe tools auto, others require approval';
    case 4:
      return '🚀 Auto Tools - Most tools auto-execute';
    case 5:
      return '⚠️ Autonomous - All tools auto-execute (dangerous!)';
    default:
      return 'Unknown';
  }
}

/**
 * Get recommended autonomy level for a model
 */
export function getRecommendedLevel(capabilities: ModelCapabilities): {
  level: AutonomyLevel;
  reason: string;
} {
  const level = determineAutonomyLevel(capabilities);

  let reason = '';
  if (level === 2) {
    reason = 'Small model - safer with manual approval';
  } else if (level === 3) {
    reason = 'Medium model - balanced autonomy';
  } else if (level === 4) {
    reason = 'Large model - high autonomy with safety checks';
  } else if (level === 5) {
    reason = 'Very large model - full autonomy (use with caution)';
  }

  return { level, reason };
}

/**
 * Check if a command is dangerous
 */
export function isDangerousCommand(command: string): boolean {
  const config = getAutonomyConfig();
  const lowerCommand = command.toLowerCase();
  return config.dangerousCommands.some(dangerous =>
    lowerCommand.includes(dangerous.toLowerCase())
  );
}
