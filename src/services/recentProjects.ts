// services/recentProjects.ts

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: number;
  fileCount?: number;
  projectType?: string;
}

const RECENT_PROJECTS_KEY = 'local-ai-recent-projects';
const MAX_RECENT_PROJECTS = 10;

export async function getRecentProjects(): Promise<RecentProject[]> {
  try {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
    if (!stored) return [];
    
    const projects: RecentProject[] = JSON.parse(stored);
    return projects.sort((a, b) => b.lastOpened - a.lastOpened);
  } catch (error) {
    console.error('Error loading recent projects:', error);
    return [];
  }
}

export async function addRecentProject(projectPath: string, fileCount?: number, projectType?: string): Promise<void> {
  try {
    const projects = await getRecentProjects();
    const projectName = projectPath.split(/[\\/]/).pop() || 'Unknown Project';
    
    // Remove existing entry if it exists
    const filteredProjects = projects.filter(p => p.path !== projectPath);
    
    // Add new entry at the beginning
    const newProject: RecentProject = {
      path: projectPath,
      name: projectName,
      lastOpened: Date.now(),
      fileCount,
      projectType
    };
    
    filteredProjects.unshift(newProject);
    
    // Keep only the most recent projects
    const limitedProjects = filteredProjects.slice(0, MAX_RECENT_PROJECTS);
    
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(limitedProjects));
  } catch (error) {
    console.error('Error saving recent project:', error);
  }
}

export async function removeRecentProject(projectPath: string): Promise<void> {
  try {
    const projects = await getRecentProjects();
    const filteredProjects = projects.filter(p => p.path !== projectPath);
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(filteredProjects));
  } catch (error) {
    console.error('Error removing recent project:', error);
  }
}

export async function clearRecentProjects(): Promise<void> {
  try {
    localStorage.removeItem(RECENT_PROJECTS_KEY);
  } catch (error) {
    console.error('Error clearing recent projects:', error);
  }
}

export function getProjectTypeFromFiles(files: string[]): string {
  // Detect project type based on files
  const hasPackageJson = files.some(f => f.endsWith('package.json'));
  const hasCargoToml = files.some(f => f.endsWith('Cargo.toml'));
  const hasPyprojectToml = files.some(f => f.endsWith('pyproject.toml'));
  const hasRequirementsTxt = files.some(f => f.endsWith('requirements.txt'));
  const hasGemfile = files.some(f => f.endsWith('Gemfile'));
  const hasGoMod = files.some(f => f.endsWith('go.mod'));
  
  if (hasPackageJson) {
    const hasReact = files.some(f => f.includes('react') || f.endsWith('.tsx') || f.endsWith('.jsx'));
    const hasVue = files.some(f => f.includes('vue') || f.endsWith('.vue'));
    const hasAngular = files.some(f => f.includes('angular'));
    const hasTauri = files.some(f => f.includes('tauri'));
    
    if (hasReact && hasTauri) return 'React + Tauri';
    if (hasReact) return 'React';
    if (hasVue) return 'Vue.js';
    if (hasAngular) return 'Angular';
    return 'Node.js';
  }
  
  if (hasCargoToml) return 'Rust';
  if (hasPyprojectToml || hasRequirementsTxt) return 'Python';
  if (hasGemfile) return 'Ruby';
  if (hasGoMod) return 'Go';
  
  // Check by file extensions
  const extensions = files.map(f => f.split('.').pop()).filter(Boolean);
  const extCounts = extensions.reduce((acc, ext) => {
    acc[ext!] = (acc[ext!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostCommonExt = Object.entries(extCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0];
  
  switch (mostCommonExt) {
    case 'ts':
    case 'tsx': return 'TypeScript';
    case 'js':
    case 'jsx': return 'JavaScript';
    case 'py': return 'Python';
    case 'rs': return 'Rust';
    case 'java': return 'Java';
    case 'cpp':
    case 'cc':
    case 'cxx': return 'C++';
    case 'c': return 'C';
    case 'cs': return 'C#';
    case 'php': return 'PHP';
    case 'rb': return 'Ruby';
    case 'go': return 'Go';
    default: return 'Mixed';
  }
}
