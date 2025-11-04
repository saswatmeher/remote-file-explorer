import * as path from 'path';

interface IconMapping {
    [key: string]: string;
}

// File extension to icon class mappings
const extensionIcons: IconMapping = {
    // Documents
    '.txt': 'icon-txt',
    '.md': 'icon-markdown',
    '.doc': 'icon-doc',
    '.docx': 'icon-docx',
    '.pdf': 'icon-pdf',
    '.odt': 'icon-doc',
    '.xlsx': 'icon-xlsx',
    '.xls': 'icon-xls',
    '.ppt': 'icon-ppt',
    '.pptx': 'icon-pptx',
    '.csv': 'icon-csv',
    
    // Source Code
    '.js': 'icon-javascript',
    '.mjs': 'icon-javascript',
    '.cjs': 'icon-javascript',
    '.ts': 'icon-typescript',
    '.tsx': 'icon-typescript',
    '.jsx': 'icon-javascript',
    '.py': 'icon-python',
    '.java': 'icon-java',
    '.c': 'icon-c',
    '.cpp': 'icon-cpp',
    '.cc': 'icon-cpp',
    '.cxx': 'icon-cpp',
    '.h': 'icon-h',
    '.hpp': 'icon-hpp',
    '.rs': 'icon-rust',
    '.go': 'icon-go',
    '.php': 'icon-php',
    '.rb': 'icon-ruby',
    '.swift': 'icon-swift',
    '.kt': 'icon-kotlin',
    '.css': 'icon-css',
    '.scss': 'icon-scss',
    '.sass': 'icon-sass',
    '.less': 'icon-less',
    '.html': 'icon-html',
    '.htm': 'icon-html',
    '.xml': 'icon-xml',
    '.json': 'icon-json',
    '.yaml': 'icon-yaml',
    '.yml': 'icon-yml',
    
    // Images
    '.jpg': 'icon-jpg',
    '.jpeg': 'icon-jpeg',
    '.png': 'icon-png',
    '.gif': 'icon-gif',
    '.svg': 'icon-svg',
    '.ico': 'icon-ico',
    '.webp': 'icon-webp',
    '.bmp': 'icon-bmp',
    
    // Archives
    '.zip': 'icon-zip',
    '.tar': 'icon-tar',
    '.gz': 'icon-gz',
    '.7z': 'icon-7z',
    '.rar': 'icon-rar',
    '.bz2': 'icon-bz2',
    
    // Executables
    '.exe': 'icon-executable',
    '.sh': 'icon-shell',
    '.bash': 'icon-bash',
    '.zsh': 'icon-zsh',
    '.bat': 'icon-bat',
    '.cmd': 'icon-cmd',
    '.ps1': 'icon-ps1',
    
    // Media
    '.mp3': 'icon-mp3',
    '.wav': 'icon-wav',
    '.ogg': 'icon-ogg',
    '.flac': 'icon-flac',
    '.mp4': 'icon-mp4',
    '.mov': 'icon-mov',
    '.avi': 'icon-avi',
    '.mkv': 'icon-mkv',
    '.webm': 'icon-webm',
    
    // Data & Config
    '.toml': 'icon-toml',
    '.ini': 'icon-ini',
    '.properties': 'icon-properties',
    '.env': 'icon-env',
    '.log': 'icon-log',
    
    // Database
    '.sql': 'icon-sql',
    '.db': 'icon-db',
    '.sqlite': 'icon-database',
    
    // Security
    '.pem': 'icon-pem',
    '.key': 'icon-key',
    '.cert': 'icon-cert',
    '.crt': 'icon-cert'
};

// Special filenames to icon class mappings
const specialFileIcons: IconMapping = {
    '.gitignore': 'icon-git',
    '.gitattributes': 'icon-git',
    '.gitmodules': 'icon-git',
    'dockerfile': 'icon-docker',
    'docker-compose.yml': 'icon-docker',
    'docker-compose.yaml': 'icon-docker',
    'readme': 'icon-readme',
    'readme.md': 'icon-readme',
    'readme.txt': 'icon-readme',
    'license': 'icon-license',
    'license.md': 'icon-license',
    'license.txt': 'icon-license',
    'makefile': 'icon-makefile',
    'package.json': 'icon-package',
    'package-lock.json': 'icon-package',
    'yarn.lock': 'icon-package',
    'tsconfig.json': 'icon-typescript',
    'webpack.config.js': 'icon-config',
    'vite.config.js': 'icon-config',
    'vite.config.ts': 'icon-config',
    'rollup.config.js': 'icon-config',
    '.eslintrc': 'icon-config',
    '.eslintrc.js': 'icon-config',
    '.eslintrc.json': 'icon-config',
    '.prettierrc': 'icon-config',
    '.editorconfig': 'icon-config'
};

/**
 * Get the CSS class name for a file icon based on its filename
 * @param fileName The name of the file
 * @returns CSS class name for the icon
 */
export function getFileIconClass(fileName: string): string {
    const defaultClass = 'icon-file-default';
    
    // Convert filename to lowercase for case-insensitive matching
    const lowerFileName = fileName.toLowerCase();
    
    // Check for special filenames first
    const specialIcon = specialFileIcons[lowerFileName];
    if (specialIcon) {
        return specialIcon;
    }
    
    // Get the file extension
    const ext = path.extname(lowerFileName);
    
    // Return the class for the extension, or default if not found
    return extensionIcons[ext] || defaultClass;
}

/**
 * Legacy function that returns emoji icons (for backwards compatibility)
 * @deprecated Use getFileIconClass instead
 */
export function getFileIcon(fileName: string): string {
    const iconClass = getFileIconClass(fileName);
    return `<span class="${iconClass}"></span>`;
}

// Function to check if a path is a directory
export function isDirectory(path: string): boolean {
    return path.endsWith('/') || path.endsWith('\\');
}