import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getWebviewContent } from './ui';

export function showFileExplorerPanel(folderPath: string) {
	const panel = vscode.window.createWebviewPanel(
		'remoteFileExplorer',
		`Remote File Explorer: ${path.basename(folderPath)}`,
		vscode.ViewColumn.Two,
		{
			enableScripts: true,
			retainContextWhenHidden: true
		}
	);

	// Handle messages from the webview
	panel.webview.onDidReceiveMessage(async (message) => {
		switch (message.command) {
			case 'requestRefresh':
				// Get the updated files and folders in the directory
				const updatedItems = fs.readdirSync(folderPath).map(item => {
					const itemPath = path.join(folderPath, item);
					return {
						name: item,
						isDirectory: fs.lstatSync(itemPath).isDirectory()
					};
				});
				// Update the webview content
				panel.webview.html = getWebviewContent(updatedItems, panel.webview);
				break;
			case 'openFile':
				const filePath = path.join(folderPath, message.item);
				const fileUri = vscode.Uri.file(filePath);
				await vscode.window.showTextDocument(fileUri, {
					viewColumn: vscode.ViewColumn.One,
					preserveFocus: false
				});
				break;
			case 'openFolder':
				const subFolderPath = path.join(folderPath, message.item);
				await vscode.commands.executeCommand('remoteFileExplorer.openInremoteFileExplorer', vscode.Uri.file(subFolderPath));
				break;
		}
	});

	// Get the files and folders in the directory
	const items = fs.readdirSync(folderPath).map(item => {
		const itemPath = path.join(folderPath, item);
		return {
			name: item,
			isDirectory: fs.lstatSync(itemPath).isDirectory()
		};
	});

	// Set the HTML content for the Webview Panel
	panel.webview.html = getWebviewContent(items, panel.webview);
}