// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { showFileExplorerPanel } from './fileExplorerPanel';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "file-explorer" is now active!');

	// Register the command to open the file explorer view
	const openInremoteFileExplorer = vscode.commands.registerCommand('remoteFileExplorer.openInremoteFileExplorer', async (uri?: vscode.Uri) => {
		let folderUri: vscode.Uri | undefined = uri;

		if (!folderUri) {
			const inputPath = await vscode.window.showInputBox({
				prompt: 'Enter a folder path',
				placeHolder: '/path/to/folder',
			});

			if (!inputPath) {
				vscode.window.showWarningMessage('No folder path entered.');
				return;
			}

			folderUri = vscode.Uri.file(inputPath);
		}

		try {
			const stat = await vscode.workspace.fs.stat(folderUri);
			if (stat.type !== vscode.FileType.Directory) {
				vscode.window.showErrorMessage('The provided path is not a folder.');
				return;
			}
			showFileExplorerPanel(folderUri.fsPath, context.extensionUri);
		} catch (err) {
			vscode.window.showErrorMessage('Invalid or inaccessible folder path.');
		}
	});

	const openInRemoteContainingFolder = vscode.commands.registerCommand('remoteFileExplorer.openInRemoteContainingFolder', async (uri?: vscode.Uri) => {
		if (!uri) {
			// If no URI is provided, use the active file
			const activeEditor = vscode.window.activeTextEditor;
			if (!activeEditor) {
				vscode.window.showWarningMessage('No file selected.');
				return;
			}
			uri = activeEditor.document.uri;
		}

		try {
			// Get the parent folder path
			const parentPath = uri.fsPath.substring(0, uri.fsPath.lastIndexOf('/'));
			const parentUri = vscode.Uri.file(parentPath);

			// Verify it's a valid directory
			const stat = await vscode.workspace.fs.stat(parentUri);
			if (stat.type !== vscode.FileType.Directory) {
				vscode.window.showErrorMessage('Could not locate the containing folder.');
				return;
			}

			showFileExplorerPanel(parentUri.fsPath, context.extensionUri);
		} catch (err) {
			vscode.window.showErrorMessage('Invalid or inaccessible parent folder.');
		}
	});

	context.subscriptions.push(openInremoteFileExplorer, openInRemoteContainingFolder);
}



// This method is called when your extension is deactivated
export function deactivate() {}
