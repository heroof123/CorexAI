import { useState } from "react";

interface FileTreeProps {
  files: string[];
  selectedFile: string;
  onFileSelect: (filePath: string) => void;
  projectPath: string;
}

export default function FileTree({ files, selectedFile, onFileSelect, projectPath }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Build tree structure
  const buildTree = (files: string[]) => {
    const tree: any = {};
    
    files.forEach(file => {
      const parts = file.split(/[\\/]/);
      let current = tree;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = index === parts.length - 1 ? null : {};
        }
        if (current[part] !== null) {
          current = current[part];
        }
      });
    });
    
    return tree;
  };

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const renderTree = (node: any, path: string = "", depth: number = 0) => {
    return Object.entries(node).map(([name, children]) => {
      const currentPath = path ? `${path}/${name}` : name;
      const isFile = children === null;
      const isExpanded = expandedFolders.has(currentPath);
      const isSelected = selectedFile === currentPath;

      if (isFile) {
        return (
          <div
            key={currentPath}
            className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-neutral-700 text-xs ${
              isSelected ? "bg-blue-600 text-white" : "text-neutral-300"
            }`}
            style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
            onClick={() => onFileSelect(currentPath)}
          >
            <svg className="w-3 h-3 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate">{name}</span>
          </div>
        );
      }

      return (
        <div key={currentPath}>
          <div
            className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-neutral-700 text-xs text-neutral-300"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => toggleFolder(currentPath)}
          >
            <svg 
              className={`w-3 h-3 text-neutral-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <svg className="w-3 h-3 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="truncate">{name}</span>
          </div>
          {isExpanded && (
            <div>
              {renderTree(children, currentPath, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const tree = buildTree(files);

  return (
    <div className="h-full bg-[#181818] flex flex-col">
      {/* Header */}
      <div className="border-b border-neutral-800 px-3 py-2 bg-[#181818]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="text-xs font-semibold text-white">Dosyalar</span>
        </div>
        <div className="text-xs text-neutral-500 mt-1 truncate">
          {projectPath.split(/[\\/]/).pop()}
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {files.length > 0 ? (
          <div className="py-2">
            {renderTree(tree)}
          </div>
        ) : (
          <div className="p-4 text-center text-neutral-500 text-xs">
            <p>Dosya bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
}