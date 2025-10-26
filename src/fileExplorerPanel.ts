import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getWebviewContent } from './webviewContent';

export function showFileExplorerPanel(folderPath: string, extensionUri: vscode.Uri) {
    // Navigation history
    const history: string[] = [folderPath];
    let currentIndex = 0;

    const panel = vscode.window.createWebviewPanel(
        'remoteFileExplorer',
        `Remote File Explorer: ${path.basename(folderPath)}`,
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
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
                const items = fs.readdirSync(newPath).map(item => {
                    const itemPath = path.join(newPath, item);
                    return {
                        name: item,
                        isDirectory: fs.lstatSync(itemPath).isDirectory()
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
                const filePath = path.join(folderPath, message.item);
                const fileUri = vscode.Uri.file(filePath);
                await vscode.window.showTextDocument(fileUri, {
                    viewColumn: vscode.ViewColumn.One,
                    preserveFocus: false
                });
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
                const subFolderPath = path.join(folderPath, message.item);
                if (message.newTab) {
                    // Open in new tab if shift was pressed
                    await vscode.commands.executeCommand('remoteFileExplorer.openInremoteFileExplorer', vscode.Uri.file(subFolderPath));
                } else {
                    // Open in the same panel and track history
                    await navigateToFolder(subFolderPath);
                }
                break;
        }
    });

    // Initialize view and navigation state
    // Use navigateToFolder so history and navigation buttons are correctly initialized
    navigateToFolder(folderPath, false);
}
