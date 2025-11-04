import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Thumbnail Management
 * For images: Direct display via webview
 * For PDFs: SVG-based preview icons
 */

/**
 * Check if file type supports thumbnails
 */
export function supportsThumbnail(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    // Support image files
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    // Support PDF files
    const documentExts = ['.pdf'];
    
    return imageExts.includes(ext) || documentExts.includes(ext);
}

/**
 * Check if file is a PDF
 */
function isPdf(filePath: string): boolean {
    return path.extname(filePath).toLowerCase() === '.pdf';
}

/**
 * Check if file is an image
 */
function isImage(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(ext);
}

/**
 * Generate a PDF preview as SVG data URI
 * Creates a stylized PDF icon with file info
 */
function generatePdfPreview(filePath: string): string | null {
    try {
        // Read PDF metadata
        let buffer: string;
        try {
            buffer = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }).toString();
        } catch {
            // If reading as UTF-8 fails, just use placeholder info
            buffer = '';
        }
        const preview = buffer.substring(0, 200);
        
        // Extract PDF version
        const versionMatch = preview.match(/%PDF-(\d+\.\d+)/);
        const version = versionMatch ? versionMatch[1] : '?.?';
        
        // Get file size
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        
        // Create an SVG-based thumbnail for PDF
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
                <defs>
                    <linearGradient id="pdfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f40f02;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#c20d01;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <!-- Background -->
                <rect width="128" height="128" fill="#f5f5f5"/>
                
                <!-- PDF Document Shape -->
                <rect x="29" y="14" width="70" height="90" rx="3" fill="url(#pdfGrad)" stroke="#8b0000" stroke-width="2"/>
                
                <!-- Folded corner -->
                <path d="M 99 14 L 99 32 L 81 32 L 99 14" fill="#8b0000" opacity="0.3"/>
                
                <!-- Header bar -->
                <rect x="29" y="14" width="70" height="12" rx="3" fill="#8b0000" opacity="0.3"/>
                
                <!-- PDF Text -->
                <text x="64" y="48" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="bold">PDF</text>
                <text x="64" y="66" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10">v${version}</text>
                <text x="64" y="80" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="9">${sizeMB} MB</text>
                
                <!-- Document lines -->
                <line x1="37" y1="90" x2="91" y2="90" stroke="white" stroke-width="1.5" opacity="0.5"/>
                <line x1="37" y1="96" x2="84" y2="96" stroke="white" stroke-width="1.5" opacity="0.5"/>
            </svg>
        `.trim();
        
        // Return as data URI
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    } catch (err) {
        console.error('Failed to generate PDF preview:', err);
        return null;
    }
}

/**
 * Get thumbnail URI for webview
 * For images: Returns direct file URI
 * For PDFs: Returns SVG data URI
 */
export async function getThumbnailUri(
    filePath: string,
    webview: vscode.Webview
): Promise<vscode.Uri | string | null> {
    if (!supportsThumbnail(filePath)) {
        return null;
    }
    
    try {
        // For PDFs, generate SVG preview
        if (isPdf(filePath)) {
            const svgDataUri = generatePdfPreview(filePath);
            return svgDataUri;
        }
        
        // For images, return direct webview URI
        if (isImage(filePath)) {
            return webview.asWebviewUri(vscode.Uri.file(filePath));
        }
        
        return null;
    } catch (err) {
        console.error('Failed to create thumbnail:', err);
        // Fallback: return original file URI for images
        if (isImage(filePath)) {
            try {
                return webview.asWebviewUri(vscode.Uri.file(filePath));
            } catch {
                return null;
            }
        }
        return null;
    }
}
