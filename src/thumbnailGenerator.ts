import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * FreeDesktop.org inspired Thumbnail Management
 * Simplified version that uses direct file URIs for webview display
 */

/**
 * Check if file type supports thumbnails
 */
export function supportsThumbnail(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    // Support image files that browsers can display natively
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    // Support PDF files (will use icon-based placeholder)
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
 * Generate a PDF preview as a data URI
 * Creates a stylized PDF icon with the first page preview text
 */
function generatePdfPreview(filePath: string): string | null {
    try {
        // Read first few KB of the PDF to get some metadata
        const buffer = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
        const preview = buffer.substring(0, 200);
        
        // Check if it's a valid PDF
        if (!preview.startsWith('%PDF')) {
            return null;
        }
        
        // Extract PDF version if available
        const versionMatch = preview.match(/%PDF-(\d+\.\d+)/);
        const version = versionMatch ? versionMatch[1] : '?.?';
        
        // Get file size
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        
        // Create an SVG-based thumbnail for PDF
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
                <defs>
                    <linearGradient id="pdfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f40f02;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#c20d01;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <!-- PDF Document Shape -->
                <rect x="20" y="10" width="70" height="90" rx="3" fill="url(#pdfGrad)" stroke="#8b0000" stroke-width="2"/>
                <path d="M 90 10 L 90 30 L 70 30 L 90 10" fill="#8b0000" opacity="0.3"/>
                <rect x="20" y="10" width="70" height="15" rx="3" fill="#8b0000" opacity="0.3"/>
                
                <!-- PDF Text -->
                <text x="55" y="45" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">PDF</text>
                <text x="55" y="62" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="9">v${version}</text>
                <text x="55" y="75" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8">${sizeMB} MB</text>
                
                <!-- Document lines -->
                <line x1="28" y1="82" x2="82" y2="82" stroke="white" stroke-width="1" opacity="0.5"/>
                <line x1="28" y1="88" x2="75" y2="88" stroke="white" stroke-width="1" opacity="0.5"/>
                <line x1="28" y1="94" x2="80" y2="94" stroke="white" stroke-width="1" opacity="0.5"/>
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
 * For images, we directly use the file URI which VS Code webview can display
 * For PDFs, we generate a custom SVG preview
 */
export function getThumbnailUri(
    filePath: string,
    webview: vscode.Webview
): vscode.Uri | string | null {
    if (!supportsThumbnail(filePath)) {
        return null;
    }
    
    try {
        // For PDFs, generate a custom preview
        if (isPdf(filePath)) {
            return generatePdfPreview(filePath);
        }
        
        // For images, convert file path to webview URI
        // VS Code webview will handle the image loading
        return webview.asWebviewUri(vscode.Uri.file(filePath));
    } catch (err) {
        console.error('Failed to create thumbnail URI:', err);
        return null;
    }
}
