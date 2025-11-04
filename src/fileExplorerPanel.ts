import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getWebviewContent } from './webviewContent';
import { supportsThumbnail, getThumbnailUri } from './thumbnailGenerator';

// Helper function to copy directory recursively
function copyDirectoryRecursive(source: string, destination: string) {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }
    
    const items = fs.readdirSync(source);
    for (const item of items) {
        const sourcePath = path.join(source, item);
        const destPath = path.join(destination, item);
        
        if (fs.lstatSync(sourcePath).isDirectory()) {
            copyDirectoryRecursive(sourcePath, destPath);
        } else {
            fs.copyFileSync(sourcePath, destPath);
        }
    }
}

export function showFileExplorerPanel(folderPath: string, extensionUri: vscode.Uri) {
    // Navigation history
    const history: string[] = [folderPath];
    let currentIndex = 0;
    
    // Clipboard for copy/cut operations
    let clipboard: { items: { name: string; isDirectory: boolean; fullPath: string }[]; operation: 'copy' | 'cut' } | null = null;

    const panel = vscode.window.createWebviewPanel(
        'remoteFileExplorer',
        `Remote File Explorer: ${path.basename(folderPath)}`,
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, 'media'),
                vscode.Uri.file(folderPath) // Allow loading files from current directory
            ]
        }
    );

    // Function to navigate to a folder and update the view
    async function navigateToFolder(newPath: string, addToHistory: boolean = true) {
        try {
            const stat = await vscode.workspace.fs.stat(vscode.Uri.file(newPath));
            if (stat.type === vscode.FileType.Directory) {
                if (addToHistory) {
                    // Remove any forward history when adding new path
                    history.splice(currentIndex + 1);
                    history.push(newPath);
                    currentIndex = history.length - 1;
                }
                folderPath = newPath;
                
                // Update localResourceRoots to allow access to current folder
                (panel as any).webview.options = {
                    ...panel.webview.options,
                    localResourceRoots: [
                        vscode.Uri.joinPath(extensionUri, 'media'),
                        vscode.Uri.file(newPath)
                    ]
                };
                
                // Get items with thumbnail support
                const itemNames = fs.readdirSync(newPath);
                const items = itemNames.map(item => {
                    const itemPath = path.join(newPath, item);
                    const isDirectory = fs.lstatSync(itemPath).isDirectory();
                    
                    let thumbnailUri: string | undefined;
                    if (!isDirectory && supportsThumbnail(itemPath)) {
                        const thumbUri = getThumbnailUri(itemPath, panel.webview);
                        if (thumbUri) {
                            thumbnailUri = thumbUri.toString();
                        }
                    }
                    
                    return {
                        name: item,
                        isDirectory,
                        fullPath: itemPath,
                        thumbnailUri
                    };
                });
                
                panel.title = `Remote File Explorer: ${path.basename(newPath)}`;
                panel.webview.html = getWebviewContent(items, panel.webview, extensionUri);
                
                // Update navigation buttons state
                panel.webview.postMessage({
                    command: 'updateNavigation',
                    canGoBack: currentIndex > 0,
                    canGoForward: currentIndex < history.length - 1
                });
            }
        } catch (err) {
            vscode.window.showErrorMessage('Invalid or inaccessible folder path.');
        }
    }

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'requestRefresh':
                await navigateToFolder(folderPath, false);
                break;
            case 'openFile':
                // Handle both old format (message.item) and new format (message.items)
                const fileName = message.item || (message.items && message.items.length > 0 ? message.items[0].name : null);
                if (fileName) {
                    const filePath = path.join(folderPath, fileName);
                    const fileUri = vscode.Uri.file(filePath);
                    await vscode.window.showTextDocument(fileUri, {
                        viewColumn: vscode.ViewColumn.One,
                        preserveFocus: false
                    });
                }
                break;
            case 'navigate':
                switch (message.direction) {
                    case 'back':
                        if (currentIndex > 0) {
                            currentIndex--;
                            await navigateToFolder(history[currentIndex], false);
                        }
                        break;
                    case 'forward':
                        if (currentIndex < history.length - 1) {
                            currentIndex++;
                            await navigateToFolder(history[currentIndex], false);
                        }
                        break;
                    case 'up':
                        const parentPath = path.dirname(folderPath);
                        if (parentPath !== folderPath) {
                            await navigateToFolder(parentPath);
                        }
                        break;
                }
                break;
            case 'openFolder':
                // Handle both old format (message.item) and new format (message.items)
                const folderName = message.item || (message.items && message.items.length > 0 ? message.items[0].name : null);
                if (folderName) {
                    const subFolderPath = path.join(folderPath, folderName);
                    if (message.newTab) {
                        // Open in new tab if shift was pressed
                        await vscode.commands.executeCommand('remoteFileExplorer.openInremoteFileExplorer', vscode.Uri.file(subFolderPath));
                    } else {
                        // Open in the same panel and track history
                        await navigateToFolder(subFolderPath);
                    }
                }
                break;
            case 'rename':
                if (message.items && message.items.length === 1) {
                    const oldName = message.items[0].name;
                    const oldPath = path.join(folderPath, oldName);
                    
                    // Show input box for new name
                    const newName = await vscode.window.showInputBox({
                        prompt: 'Enter new name',
                        value: oldName,
                        validateInput: (value) => {
                            if (!value || value.trim() === '') {
                                return 'Name cannot be empty';
                            }
                            if (value.includes('/') || value.includes('\\')) {
                                return 'Name cannot contain / or \\';
                            }
                            const newPath = path.join(folderPath, value);
                            if (newPath !== oldPath && fs.existsSync(newPath)) {
                                return 'A file or folder with that name already exists';
                            }
                            return null;
                        }
                    });
                    
                    if (newName && newName !== oldName) {
                        try {
                            const newPath = path.join(folderPath, newName);
                            fs.renameSync(oldPath, newPath);
                            vscode.window.showInformationMessage(`Renamed to ${newName}`);
                            // Refresh the view
                            await navigateToFolder(folderPath, false);
                        } catch (err) {
                            vscode.window.showErrorMessage(`Failed to rename: ${err}`);
                        }
                    }
                }
                break;
            case 'copy':
                if (message.items && message.items.length > 0) {
                    clipboard = {
                        items: message.items.map((item: any) => ({
                            name: item.name,
                            isDirectory: item.isDirectory,
                            fullPath: path.join(folderPath, item.name)
                        })),
                        operation: 'copy'
                    };
                    vscode.window.showInformationMessage(`Copied ${message.items.length} item(s)`);
                }
                break;
            case 'cut':
                if (message.items && message.items.length > 0) {
                    clipboard = {
                        items: message.items.map((item: any) => ({
                            name: item.name,
                            isDirectory: item.isDirectory,
                            fullPath: path.join(folderPath, item.name)
                        })),
                        operation: 'cut'
                    };
                    vscode.window.showInformationMessage(`Cut ${message.items.length} item(s)`);
                }
                break;
            case 'paste':
                if (clipboard && clipboard.items.length > 0) {
                    try {
                        for (const item of clipboard.items) {
                            const sourcePath = item.fullPath;
                            let destName = item.name;
                            let destPath = path.join(folderPath, destName);
                            
                            // Handle name conflicts
                            let counter = 1;
                            while (fs.existsSync(destPath) && sourcePath !== destPath) {
                                const ext = path.extname(item.name);
                                const base = path.basename(item.name, ext);
                                destName = `${base} (${counter})${ext}`;
                                destPath = path.join(folderPath, destName);
                                counter++;
                            }
                            
                            if (sourcePath === destPath) {
                                continue; // Skip if source and dest are the same
                            }
                            
                            if (clipboard.operation === 'copy') {
                                // Copy operation
                                if (item.isDirectory) {
                                    copyDirectoryRecursive(sourcePath, destPath);
                                } else {
                                    fs.copyFileSync(sourcePath, destPath);
                                }
                            } else {
                                // Cut operation (move)
                                fs.renameSync(sourcePath, destPath);
                            }
                        }
                        
                        const operation = clipboard.operation === 'copy' ? 'Copied' : 'Moved';
                        vscode.window.showInformationMessage(`Pasted using ${operation} ${clipboard.items.length} item(s)`);
                        
                        // Clear clipboard after cut operation
                        if (clipboard.operation === 'cut') {
                            clipboard = null;
                        }
                        
                        // Refresh the view
                        await navigateToFolder(folderPath, false);
                    } catch (err) {
                        vscode.window.showErrorMessage(`Failed to paste: ${err}`);
                    }
                } else {
                    vscode.window.showInformationMessage('Nothing to paste');
                }
                break;
            case 'delete':
                if (message.items && message.items.length > 0) {
                    const itemNames = message.items.map((item: any) => item.name).join(', ');
                    const confirmation = await vscode.window.showWarningMessage(
                        `Are you sure you want to delete ${message.items.length} item(s)?\n${itemNames}`,
                        { modal: true },
                        'Delete'
                    );
                    
                    if (confirmation === 'Delete') {
                        try {
                            for (const item of message.items) {
                                const itemPath = path.join(folderPath, item.name);
                                if (item.isDirectory) {
                                    fs.rmSync(itemPath, { recursive: true, force: true });
                                } else {
                                    fs.unlinkSync(itemPath);
                                }
                            }
                            vscode.window.showInformationMessage(`Deleted ${message.items.length} item(s)`);
                            // Refresh the view
                            await navigateToFolder(folderPath, false);
                        } catch (err) {
                            vscode.window.showErrorMessage(`Failed to delete: ${err}`);
                        }
                    }
                }
                break;
        }
    });

    // Initialize view and navigation state
    // Use navigateToFolder so history and navigation buttons are correctly initialized
    navigateToFolder(folderPath, false);
}
