// core/context/providers/ProjectContextProvider.ts
// Provides project-level context

import { exists, readDir, readTextFile } from '@tauri-apps/plugin-fs';

export interface ProjectContext {
  name: string;
  path: string;
  type: 'web' | 'mobile' | 'desktop' | 'library' | 'unknown';
  languages: string[];
  frameworks: string[];
  dependencies: Record<string, string>;
  structure: {
    hasTests: boolean;
    hasDocs: boolean;
    hasCI: boolean;
    mainFiles: string[];
  };
}

export class ProjectContextProvider {
  private projectCache: Map<string, ProjectContext> = new Map();

  /**
   * Get project context
   */
  async getProjectContext(projectPath: string): Promise<ProjectContext | null> {
    // Check cache
    const cached = this.projectCache.get(projectPath);
    if (cached) {
      return cached;
    }

    try {
      const context: ProjectContext = {
        name: this.getProjectName(projectPath),
        path: projectPath,
        type: await this.detectProjectType(projectPath),
        languages: await this.detectLanguages(projectPath),
        frameworks: await this.detectFrameworks(projectPath),
        dependencies: await this.getDependencies(projectPath),
        structure: await this.analyzeStructure(projectPath),
      };

      this.projectCache.set(projectPath, context);
      return context;
    } catch (error) {
      console.error('Failed to get project context:', error);
      return null;
    }
  }

  /**
   * Get project name from path
   */
  private getProjectName(projectPath: string): string {
    return projectPath.split(/[/\\]/).pop() || 'Unknown Project';
  }

  /**
   * Detect project type
   */
  private async detectProjectType(projectPath: string): Promise<ProjectContext['type']> {
    try {

      // Check for package.json (web/node project)
      if (await exists(`${projectPath}/package.json`)) {
        const packageJson = await this.readJsonFile(`${projectPath}/package.json`);
        
        if (packageJson.dependencies?.['react-native']) return 'mobile';
        if (packageJson.dependencies?.['@tauri-apps/api']) return 'desktop';
        if (packageJson.dependencies?.react || packageJson.dependencies?.vue) return 'web';
      }

      // Check for Cargo.toml (Rust project)
      if (await exists(`${projectPath}/Cargo.toml`)) {
        return 'desktop';
      }

      // Check for requirements.txt (Python project)
      if (await exists(`${projectPath}/requirements.txt`)) {
        return 'library';
      }

      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Detect programming languages used
   */
  private async detectLanguages(projectPath: string): Promise<string[]> {
    try {
      const extensions = new Set<string>();
      
      // Recursive function to scan directories
      const scanDir = async (dirPath: string) => {
        try {
          const entries = await readDir(dirPath);
          
          for (const entry of entries) {
            if (entry.isDirectory) {
              // Skip common directories
              if (!entry.name.includes('node_modules') && 
                  !entry.name.includes('.git') &&
                  !entry.name.includes('dist')) {
                await scanDir(entry.name);
              }
            } else {
              const ext = entry.name.split('.').pop()?.toLowerCase();
              if (ext) extensions.add(ext);
            }
          }
        } catch {
          // Ignore errors for individual directories
        }
      };
      
      await scanDir(projectPath);

      const languageMap: Record<string, string> = {
        ts: 'TypeScript',
        tsx: 'TypeScript',
        js: 'JavaScript',
        jsx: 'JavaScript',
        py: 'Python',
        rs: 'Rust',
        go: 'Go',
        java: 'Java',
        cpp: 'C++',
        c: 'C',
        cs: 'C#',
        rb: 'Ruby',
        php: 'PHP',
      };

      const languages = Array.from(extensions)
        .map(ext => languageMap[ext])
        .filter(Boolean);

      return [...new Set(languages)];
    } catch {
      return [];
    }
  }

  /**
   * Detect frameworks used
   */
  private async detectFrameworks(projectPath: string): Promise<string[]> {
    try {
      const packageJson = await this.readJsonFile(`${projectPath}/package.json`);
      const frameworks: string[] = [];

      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (deps.react) frameworks.push('React');
      if (deps.vue) frameworks.push('Vue');
      if (deps.angular) frameworks.push('Angular');
      if (deps.svelte) frameworks.push('Svelte');
      if (deps.next) frameworks.push('Next.js');
      if (deps.nuxt) frameworks.push('Nuxt.js');
      if (deps['@tauri-apps/api']) frameworks.push('Tauri');
      if (deps.electron) frameworks.push('Electron');
      if (deps.express) frameworks.push('Express');
      if (deps.fastify) frameworks.push('Fastify');

      return frameworks;
    } catch {
      return [];
    }
  }

  /**
   * Get project dependencies
   */
  private async getDependencies(projectPath: string): Promise<Record<string, string>> {
    try {
      const packageJson = await this.readJsonFile(`${projectPath}/package.json`);
      return packageJson.dependencies || {};
    } catch {
      return {};
    }
  }

  /**
   * Analyze project structure
   */
  private async analyzeStructure(projectPath: string) {

    const structure = {
      hasTests: false,
      hasDocs: false,
      hasCI: false,
      mainFiles: [] as string[],
    };

    try {
      // Check for test directories
      structure.hasTests = 
        await exists(`${projectPath}/test`) ||
        await exists(`${projectPath}/tests`) ||
        await exists(`${projectPath}/__tests__`);

      // Check for docs
      structure.hasDocs = 
        await exists(`${projectPath}/docs`) ||
        await exists(`${projectPath}/README.md`);

      // Check for CI
      structure.hasCI = 
        await exists(`${projectPath}/.github/workflows`) ||
        await exists(`${projectPath}/.gitlab-ci.yml`);

      // Find main files
      const mainFileNames = [
        'index.ts', 'index.js', 'main.ts', 'main.js',
        'app.ts', 'app.js', 'server.ts', 'server.js',
        'index.tsx', 'App.tsx', 'main.tsx'
      ];

      for (const fileName of mainFileNames) {
        if (await exists(`${projectPath}/src/${fileName}`)) {
          structure.mainFiles.push(`src/${fileName}`);
        } else if (await exists(`${projectPath}/${fileName}`)) {
          structure.mainFiles.push(fileName);
        }
      }
    } catch (error) {
      console.error('Error analyzing structure:', error);
    }

    return structure;
  }

  /**
   * Read and parse JSON file
   */
  private async readJsonFile(filePath: string): Promise<any> {
    try {
      const content = await readTextFile(filePath);
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.projectCache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.projectCache.size,
      projects: Array.from(this.projectCache.keys()),
    };
  }
}
