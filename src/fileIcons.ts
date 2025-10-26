import * as path from 'path';

interface IconMapping {
    [key: string]: string;
}

// File extension to icon mappings (Yaru-style)
const extensionIcons: IconMapping = {
    // Documents
    '.txt': '📄',
    '.md': '📝',
    '.doc': '📘',
    '.docx': '📘',
    '.pdf': '📕',
    '.odt': '📘',
    '.xlsx': '📊',
    '.xls': '📊',
    '.ppt': '📈',
    '.pptx': '📈',
    '.csv': '📑',
    
    // Source Code
    '.js': '📜',
    '.ts': '📜',
    '.py': '🐍',
    '.java': '☕',
    '.c': '📜',
    '.cpp': '📜',
    '.h': '📜',
    '.css': '🎨',
    '.scss': '🎨',
    '.sass': '🎨',
    '.html': '🌐',
    '.xml': '📋',
    '.json': '📋',
    '.yaml': '📋',
    '.yml': '📋',
    
    // Images
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.png': '🖼️',
    '.gif': '🖼️',
    '.svg': '🖼️',
    '.ico': '🖼️',
    '.webp': '🖼️',
    
    // Archives
    '.zip': '📦',
    '.tar': '📦',
    '.gz': '📦',
    '.7z': '📦',
    '.rar': '📦',
    
    // Executables
    '.exe': '⚙️',
    '.sh': '⚙️',
    '.bat': '⚙️',
    '.cmd': '⚙️',
    
    // Special files
    '.gitignore': '📄',
    'package.json': '📦',
    'package-lock.json': '📦',
    'tsconfig.json': '⚙️',
    '.env': '🔒',
    
    // Media
    '.mp3': '🎵',
    '.wav': '🎵',
    '.mp4': '🎥',
    '.mov': '🎥',
    '.avi': '🎥',
    '.mkv': '🎥'
};

// Special filenames to icon mappings
const specialFileIcons: IconMapping = {
    '.gitignore': '📄',
    'dockerfile': '🐳',
    'docker-compose.yml': '🐳',
    'readme.md': '📖',
    'license': '📜',
    'makefile': '⚙️',
};

export function getFileIcon(fileName: string): string {
    // Default icon for unknown files
    const defaultIcon = '📄';
    // Default icon for folders
    const folderIcon = '📁';
    
    // Handle folders
    try {
        if (fileName.endsWith('/') || fileName.endsWith('\\')) {
            return folderIcon;
        }
    } catch (e) {
        // If there's any error in string operations, return default icon
        return defaultIcon;
    }

    // Convert filename to lowercase for case-insensitive matching
    const lowerFileName = fileName.toLowerCase();
    
    // Check for special filenames first
    const specialIcon = specialFileIcons[lowerFileName];
    if (specialIcon) {
        return specialIcon;
    }
    
    // Get the file extension
    const ext = path.extname(lowerFileName);
    
    // Return the icon for the extension, or default if not found
    return extensionIcons[ext] || defaultIcon;
}

// Function to check if a path is a directory
export function isDirectory(path: string): boolean {
    return path.endsWith('/') || path.endsWith('\\');
}