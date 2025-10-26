// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { showFileExplorerPanel } from './handler';

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
			showFileExplorerPanel(folderUri.fsPath);
		} catch (err) {
			vscode.window.showErrorMessage('Invalid or inaccessible folder path.');
		}
	});

	context.subscriptions.push(openInremoteFileExplorer);

	// ...no additional context command registrations needed for the webview
}



// This method is called when your extension is deactivated
export function deactivate() {}
