import fs from 'fs-extra';
import path from 'path';

/**
 * Check if a file is a text file
 * @param filePath File path
 * @returns True if the file is a text file
 */
export async function isTextFile(filePath: string): Promise<boolean> {
  try {
    // Check if the file exists
    if (!await fs.pathExists(filePath)) {
      return false;
    }
    
    // Get file stats
    const stats = await fs.stat(filePath);
    
    // Skip directories
    if (stats.isDirectory()) {
      return false;
    }
    
    // Skip large files (> 1MB)
    if (stats.size > 1024 * 1024) {
      return false;
    }
    
    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    
    // Common binary file extensions
    const binaryExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
      '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
      '.zip', '.tar', '.gz', '.7z', '.rar',
      '.exe', '.dll', '.so', '.dylib',
      '.mp3', '.mp4', '.avi', '.mov', '.flv',
      '.ttf', '.otf', '.woff', '.woff2'
    ];
    
    // If the extension is in the binary list, it's not a text file
    if (binaryExtensions.includes(ext)) {
      return false;
    }
    
    // Read the first 1024 bytes of the file
    const buffer = Buffer.alloc(1024);
    const fd = await fs.open(filePath, 'r');
    const { bytesRead } = await fs.read(fd, buffer, 0, 1024, 0);
    await fs.close(fd);
    
    // Check for null bytes (common in binary files)
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.warn(`Warning: Could not determine if ${filePath} is a text file: ${error.message}`);
    return false;
  }
}

/**
 * Get the language of a file based on its extension
 * @param filePath File path
 * @returns Language name or null if unknown
 */
export function getFileLanguage(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  
  const languageMap: Record<string, string> = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (React)',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (React)',
    '.py': 'Python',
    '.rb': 'Ruby',
    '.java': 'Java',
    '.c': 'C',
    '.cpp': 'C++',
    '.cs': 'C#',
    '.go': 'Go',
    '.php': 'PHP',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.less': 'Less',
    '.json': 'JSON',
    '.xml': 'XML',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.md': 'Markdown',
    '.sh': 'Shell',
    '.bat': 'Batch',
    '.ps1': 'PowerShell',
    '.sql': 'SQL',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.rs': 'Rust',
    '.dart': 'Dart',
    '.lua': 'Lua',
    '.r': 'R',
    '.pl': 'Perl',
    '.ex': 'Elixir',
    '.exs': 'Elixir',
    '.erl': 'Erlang',
    '.hs': 'Haskell',
    '.fs': 'F#',
    '.fsx': 'F#',
    '.scala': 'Scala',
    '.clj': 'Clojure',
    '.groovy': 'Groovy',
    '.tf': 'Terraform',
    '.vue': 'Vue',
    '.svelte': 'Svelte'
  };
  
  return languageMap[ext] || null;
} 