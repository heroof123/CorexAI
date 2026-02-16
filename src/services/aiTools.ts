// AI Tool System - CoreX AI OS
// Tools that AI can use to interact with the system

import { invoke } from '@tauri-apps/api/core';

// Tool definitions
export interface Tool {
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: string;
      description: string;
      required?: boolean;
    };
  };
}

export const AVAILABLE_TOOLS: Tool[] = [
  {
    name: 'run_terminal',
    description: 'Execute a terminal command and get the output. Use this to run npm, git, build commands, etc.',
    parameters: {
      command: {
        type: 'string',
        description: 'The terminal command to execute (e.g., "npm install axios", "git status")',
        required: true
      }
    }
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file from the project',
    parameters: {
      path: {
        type: 'string',
        description: 'Relative path to the file (e.g., "src/App.tsx")',
        required: true
      }
    }
  },
  {
    name: 'write_file',
    description: 'Write or update a file in the project',
    parameters: {
      path: {
        type: 'string',
        description: 'Relative path to the file',
        required: true
      },
      content: {
        type: 'string',
        description: 'The content to write to the file',
        required: true
      }
    }
  },
  {
    name: 'list_files',
    description: 'List files in a directory',
    parameters: {
      path: {
        type: 'string',
        description: 'Directory path (default: current directory)',
        required: false
      }
    }
  },
  {
    name: 'plan_task',
    description: 'Create a detailed plan for a complex task. Break it down into steps.',
    parameters: {
      task: {
        type: 'string',
        description: 'The task to plan (e.g., "Add dark mode to the app")',
        required: true
      },
      context: {
        type: 'string',
        description: 'Additional context about the project',
        required: false
      }
    }
  },
  {
    name: 'generate_code',
    description: 'Generate code for a specific component or feature',
    parameters: {
      description: {
        type: 'string',
        description: 'What code to generate (e.g., "React button component with hover effect")',
        required: true
      },
      language: {
        type: 'string',
        description: 'Programming language (e.g., "typescript", "javascript", "python")',
        required: false
      }
    }
  },
  {
    name: 'test_code',
    description: 'Test code or run project tests',
    parameters: {
      type: {
        type: 'string',
        description: 'Test type: "unit", "integration", "build", or "all"',
        required: false
      },
      path: {
        type: 'string',
        description: 'Specific file or directory to test',
        required: false
      }
    }
  }
];

// Tool execution
export async function executeTool(toolName: string, parameters: any): Promise<any> {
  console.log(`🔧 Executing tool: ${toolName}`, parameters);
  
  try {
    switch (toolName) {
      case 'run_terminal':
        return await runTerminal(parameters.command);
      
      case 'read_file':
        return await readFile(parameters.path);
      
      case 'write_file':
        return await writeFile(parameters.path, parameters.content);
      
      case 'list_files':
        return await listFiles(parameters.path || '.');
      
      case 'plan_task':
        return await planTask(parameters.task, parameters.context);
      
      case 'generate_code':
        return await generateCode(parameters.description, parameters.language);
      
      case 'test_code':
        return await testCode(parameters.type, parameters.path);
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`❌ Tool execution failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Tool implementations
async function runTerminal(command: string): Promise<any> {
  try {
    // Windows için cmd kullan
    const isWindows = navigator.platform.toLowerCase().includes('win');
    const shell = isWindows ? 'cmd' : 'sh';
    const shellArgs = isWindows ? ['/C', command] : ['-c', command];
    
    const result = await invoke('execute_command', { 
      command: shell,
      args: shellArgs,
      cwd: null
    });
    
    // Result zaten JSON formatında
    const output = result as any;
    
    return {
      success: output.success || false,
      stdout: output.stdout || '',
      stderr: output.stderr || '',
      command,
      exitCode: output.exit_code
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Command execution failed',
      command,
      stdout: '',
      stderr: String(error)
    };
  }
}

async function readFile(path: string): Promise<any> {
  try {
    const content = await invoke('read_file_content', { path });
    return {
      success: true,
      content,
      path
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'File read failed',
      path
    };
  }
}

async function writeFile(path: string, content: string): Promise<any> {
  try {
    await invoke('write_file', { path, content });
    return {
      success: true,
      path,
      message: 'File written successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'File write failed',
      path
    };
  }
}

async function listFiles(path: string): Promise<any> {
  try {
    const files = await invoke('get_all_files', { path });
    return {
      success: true,
      files,
      path,
      count: Array.isArray(files) ? files.length : 0
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Directory listing failed',
      path
    };
  }
}

// Generate tool prompt for AI
export function getToolsPrompt(): string {
  return `
🔧 AVAILABLE TOOLS:

You can use these tools by responding in this format:
TOOL: tool_name
PARAMS: {"param1": "value1", "param2": "value2"}

Available tools:

${AVAILABLE_TOOLS.map(tool => `
**${tool.name}**
Description: ${tool.description}
Parameters:
${Object.entries(tool.parameters).map(([name, param]) => 
  `  - ${name} (${param.type}${param.required ? ', required' : ''}): ${param.description}`
).join('\n')}
`).join('\n')}

Example usage:
TOOL: run_terminal
PARAMS: {"command": "npm install axios"}

After using a tool, I will provide you with the result, and you can continue the conversation or use another tool.
`;
}

// Parse AI response for tool calls
export function parseToolCall(response: string): { toolName: string; parameters: any } | null {
  try {
    // Yeni format: TOOL:tool_name|PARAMS:{json}
    const toolMatch = response.match(/TOOL:(\w+)\|PARAMS:({[\s\S]*?})/);
    
    if (toolMatch) {
      const toolName = toolMatch[1];
      const paramsJson = toolMatch[2];
      
      try {
        const parameters = JSON.parse(paramsJson);
        console.log(`✅ Tool parse edildi: ${toolName}`, parameters);
        return { toolName, parameters };
      } catch (jsonError) {
        console.error('❌ JSON parse hatası:', paramsJson);
        return null;
      }
    }
    
    // Eski format desteği: TOOL: ve PARAMS: ayrı satırlarda
    const oldToolMatch = response.match(/TOOL:\s*(\w+)/);
    const oldParamsMatch = response.match(/PARAMS:\s*({[\s\S]*?})/);
    
    if (oldToolMatch && oldParamsMatch) {
      const toolName = oldToolMatch[1];
      const parameters = JSON.parse(oldParamsMatch[1]);
      console.log(`✅ Tool parse edildi (eski format): ${toolName}`, parameters);
      return { toolName, parameters };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Tool parse hatası:', error);
    return null;
  }
}


// 🤖 MULTI-AGENT TOOLS

async function planTask(task: string, context?: string): Promise<any> {
  try {
    console.log('📋 Planning task:', task);
    
    // Basit plan oluştur
    const plan = {
      task,
      steps: [
        '1. Analyze requirements',
        '2. Design solution',
        '3. Implement code',
        '4. Test functionality',
        '5. Review and refine'
      ],
      context: context || 'No additional context',
      estimatedTime: 'Depends on complexity',
      recommendations: [
        'Break down into smaller tasks',
        'Test incrementally',
        'Document changes'
      ]
    };
    
    return {
      success: true,
      plan,
      message: 'Plan created successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Planning failed'
    };
  }
}

async function generateCode(description: string, language?: string): Promise<any> {
  try {
    console.log('💻 Generating code:', description);
    
    // Basit kod template'i
    const lang = language || 'typescript';
    let code = '';
    
    if (lang === 'typescript' || lang === 'javascript') {
      code = `// ${description}
export function generatedFunction() {
  // TODO: Implement ${description}
  console.log('Generated function');
  return true;
}`;
    } else if (lang === 'python') {
      code = `# ${description}
def generated_function():
    # TODO: Implement ${description}
    print('Generated function')
    return True`;
    } else {
      code = `// ${description}\n// TODO: Implement this`;
    }
    
    return {
      success: true,
      code,
      language: lang,
      description,
      message: 'Code generated successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Code generation failed'
    };
  }
}

async function testCode(type?: string, path?: string): Promise<any> {
  try {
    console.log('🧪 Testing code:', type, path);
    
    const testType = type || 'build';
    let command = '';
    
    switch (testType) {
      case 'unit':
        command = 'npm test';
        break;
      case 'integration':
        command = 'npm run test:integration';
        break;
      case 'build':
        command = 'npm run build';
        break;
      case 'all':
        command = 'npm test && npm run build';
        break;
      default:
        command = 'npm run build';
    }
    
    // Terminal komutu çalıştır
    const result = await runTerminal(command);
    
    return {
      success: result.success,
      testType,
      command,
      output: result.stdout,
      errors: result.stderr,
      message: result.success ? 'Tests passed' : 'Tests failed'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Testing failed'
    };
  }
}
