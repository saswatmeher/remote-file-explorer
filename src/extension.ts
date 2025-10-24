// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "file-explorer" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('file-explorer.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from file-explorer!');
	});

	context.subscriptions.push(disposable);

	// Register the command to open the file explorer view
	const openInFileExplorer = vscode.commands.registerCommand('fileExplorer.openInFileExplorer', (uri: vscode.Uri) => {
		// Ask the user to input a folder path

		// const folderPath = await vscode.window.showInputBox({
		// 	prompt: 'Enter the folder path to open in File Explorer',
		// 	placeHolder: '/path/to/folder'
		// });
		const folderPath = uri.fsPath;

		if (!folderPath) {
			vscode.window.showErrorMessage('No folder path provided.');
			return;
		}

		if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) {
			vscode.window.showErrorMessage('Invalid folder path. Please provide a valid directory.');
			return;
		}

		// Create and show a new Webview Panel
		const panel = vscode.window.createWebviewPanel(
			'fileExplorer',
			`File Explorer: ${path.basename(folderPath)}`,
			vscode.ViewColumn.Two,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		// Get the files and folders in the directory
		const items = fs.readdirSync(folderPath).map(item => {
			const itemPath = path.join(folderPath, item);
			return {
				name: item,
				isDirectory: fs.lstatSync(itemPath).isDirectory()
			};
		});

		// Set the HTML content for the Webview Panel
		panel.webview.html = getWebviewContent(items);
	});

	context.subscriptions.push(openInFileExplorer);

	// Register the context menu item
	const showContextMenu = vscode.commands.registerCommand('fileExplorer.showContextMenu', (uri: vscode.Uri) => {
		vscode.commands.executeCommand('setContext', 'fileExplorerContext', true);
	});

	context.subscriptions.push(showContextMenu);
}

function getWebviewContent(items: { name: string; isDirectory: boolean }[]): string {
	const listItems = items.map(item => `
		<div class="item ${item.isDirectory ? 'folder' : 'file'}">
			<span class="icon">📁</span>
			<span class="name">${item.name}</span>
		</div>
	`).join('');

	return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>File Explorer</title>
			<style>
				body {
					font-family: Arial, sans-serif;
					margin: 0;
					padding: 0;
					display: flex;
					flex-wrap: wrap;
				}
				.item {
					display: flex;
					align-items: center;
					margin: 10px;
					cursor: pointer;
				}
				.icon {
					margin-right: 10px;
				}
				.folder .icon {
					color: blue;
				}
				.file .icon {
					color: gray;
				}
			</style>
		</head>
		<body>
			${listItems}
		</body>
		</html>
	`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
