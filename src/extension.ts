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
	const openInFileExplorer = vscode.commands.registerCommand('fileExplorer.openInFileExplorer', async (uri?: vscode.Uri) => {
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

			const folderPath = folderUri.fsPath;
			const panel = vscode.window.createWebviewPanel(
				'fileExplorer',
				`File Explorer: ${path.basename(folderPath)}`,
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
					case 'openToSide':
						{
							const filePathSide = path.join(folderPath, message.item);
							await vscode.window.showTextDocument(vscode.Uri.file(filePathSide), { viewColumn: vscode.ViewColumn.Two });
						}
						break;
					case 'copyPath':
						{
							const p = path.join(folderPath, message.item);
							await vscode.env.clipboard.writeText(p);
							vscode.window.showInformationMessage('Path copied to clipboard');
						}
						break;
					case 'delete':
						{
							const delUri = vscode.Uri.file(path.join(folderPath, message.item));
							const answer = await vscode.window.showWarningMessage(
								`Are you sure you want to delete ${message.item}?`,
								{ modal: true },
								"Yes",
								"No"
							);
							if (answer === 'Yes') {
								await vscode.workspace.fs.delete(delUri);
								panel.webview.postMessage({ command: 'refresh' });
							}
						}
						break;
					case 'newFile':
						{
							const base = message.isDirectory ? path.join(folderPath, message.item) : folderPath;
							const fileName = await vscode.window.showInputBox({ prompt: 'Enter file name', placeHolder: 'example.txt' });
							if (fileName) {
								const newFilePath = path.join(base, fileName);
								await vscode.workspace.fs.writeFile(vscode.Uri.file(newFilePath), new Uint8Array());
								panel.webview.postMessage({ command: 'refresh' });
							}
						}
						break;
					case 'newFolder':
						{
							const base = message.isDirectory ? path.join(folderPath, message.item) : folderPath;
							const folderName = await vscode.window.showInputBox({ prompt: 'Enter folder name', placeHolder: 'New Folder' });
							if (folderName) {
								const newFolderPath = path.join(base, folderName);
								await vscode.workspace.fs.createDirectory(vscode.Uri.file(newFolderPath));
								panel.webview.postMessage({ command: 'refresh' });
							}
						}
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
						await vscode.commands.executeCommand('fileExplorer.openInFileExplorer', vscode.Uri.file(subFolderPath));
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
		} catch (err) {
			vscode.window.showErrorMessage('Invalid or inaccessible folder path.');
		}

		
	});

	context.subscriptions.push(openInFileExplorer);

	// ...no additional context command registrations needed for the webview
}

function getWebviewContent(items: { name: string; isDirectory: boolean }[], webview: vscode.Webview): string {
	const listItems = items.map(item => `
		<div class="item ${item.isDirectory ? 'folder' : 'file'}" data-name="${item.name}" data-is-directory="${item.isDirectory}">
			<div class="thumb">${item.isDirectory ? '📁' : '📄'}</div>
			<div class="name">${item.name}</div>
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
				:root {
					--item-size: 64px;
				}
				body {
					font-family: Arial, sans-serif;
					margin: 0;
					padding: 0;
					display: flex;
					flex-direction: column;
					height: 100vh;
				}
				.toolbar {
					display: flex;
					gap: 8px;
					padding: 8px;
					align-items: center;
					background: var(--vscode-editor-background);
					border-bottom: 1px solid rgba(128,128,128,0.06);
				}
				.btn {
					padding: 6px 8px;
					border-radius: 4px;
					cursor: pointer;
					background: transparent;
					color: var(--vscode-editor-foreground);
					border: 1px solid transparent;
				}
				.btn.active {
					background: var(--vscode-list-activeSelectionBackground);
					color: var(--vscode-list-activeSelectionForeground);
				}
				.btn:focus { outline: 2px solid var(--vscode-focusBorder); }
				.controls { margin-left: auto; display:flex; gap:6px; align-items:center }

				#items.wrap {
					padding: 8px;
					overflow: auto;
					flex: 1 1 auto;
				}

				/* List mode */
				#items.list .item {
					display: flex;
					align-items: center;
					gap: 12px;
					padding: 6px 10px;
					white-space: nowrap;
				}

				/* Grid mode */
				#items.grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(var(--item-size), 1fr));
					gap: 12px;
					padding: 12px;
					align-content: start;
					overflow: auto;
					flex: 1 1 auto;
				}
				#items.grid .item {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: flex-start;
					gap: 6px;
					padding: 8px;
					text-align: center;
				}

				.item .thumb {
					width: var(--item-size);
					height: var(--item-size);
					display:flex;
					align-items:center;
					justify-content:center;
					font-size: calc(var(--item-size) * 0.5);
					background: rgba(128,128,128,0.04);
					border-radius: 6px;
				}
				.item .name {
					overflow: hidden;
					text-overflow: ellipsis;
					max-width: 100%;
				}

				.item:hover { background-color: var(--vscode-list-hoverBackground); }
				.selected { background-color: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }

				/* context menu styles */
				#context-menu { font-size: 13px }
			</style>
		</head>
		<body>
			<div class="toolbar">
				<button id="listBtn" class="btn active" title="List view">List</button>
				<button id="gridBtn" class="btn" title="Grid view">Grid</button>
				<div class="controls">
					<button id="zoomOut" class="btn" title="Zoom out">-</button>
					<span id="zoomLabel">100%</span>
					<button id="zoomIn" class="btn" title="Zoom in">+</button>
				</div>
			</div>

			<div id="items" class="wrap list">
				${listItems}
			</div>

			<script>
				(function() {
					const vscode = acquireVsCodeApi();
					let selectedItem = null;
					let zoom = 100;

					const listBtn = document.getElementById('listBtn');
					const gridBtn = document.getElementById('gridBtn');
					const itemsEl = document.getElementById('items');
					const zoomIn = document.getElementById('zoomIn');
					const zoomOut = document.getElementById('zoomOut');
					const zoomLabel = document.getElementById('zoomLabel');

					function setView(mode) {
						if (mode === 'grid') {
							itemsEl.classList.remove('list');
							itemsEl.classList.add('grid');
							gridBtn.classList.add('active');
							listBtn.classList.remove('active');
						} else {
							itemsEl.classList.remove('grid');
							itemsEl.classList.add('list');
							listBtn.classList.add('active');
							gridBtn.classList.remove('active');
						}
					}

					listBtn.addEventListener('click', () => setView('list'));
					gridBtn.addEventListener('click', () => setView('grid'));

					function updateZoom() {
						const size = Math.max(40, Math.min(200, Math.round(64 * (zoom/100))));
						document.documentElement.style.setProperty('--item-size', size + 'px');
						zoomLabel.textContent = zoom + '%';
					}

					zoomIn.addEventListener('click', () => { zoom = Math.min(200, zoom + 20); updateZoom(); });
					zoomOut.addEventListener('click', () => { zoom = Math.max(40, zoom - 20); updateZoom(); });
					updateZoom();

					// Handle messages from the extension
					window.addEventListener('message', event => {
						const message = event.data;
						switch (message.command) {
							case 'refresh':
								// Ask extension for updated items
								vscode.postMessage({ command: 'requestRefresh' });
								break;
						}
					});

					// Create an in-webview context menu
					const menu = document.createElement('div');
					menu.id = 'context-menu';
					menu.style.position = 'fixed';
					menu.style.display = 'none';
					menu.style.background = 'var(--vscode-menu-background, #252526)';
					menu.style.color = 'var(--vscode-menu-foreground, #cccccc)';
					menu.style.border = '1px solid var(--vscode-menu-border, rgba(128,128,128,0.2))';
					menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
					menu.style.zIndex = '1000';
					menu.style.minWidth = '160px';
					menu.style.padding = '4px 0';
					menu.style.borderRadius = '3px';
					document.body.appendChild(menu);

					function clearMenu() { menu.innerHTML = ''; }
					function addMenuItem(label, cmd) {
						const it = document.createElement('div');
						it.className = 'ctx-item';
						it.textContent = label;
						it.style.padding = '6px 12px';
						it.style.cursor = 'default';
						it.addEventListener('mouseenter', () => it.style.background = 'var(--vscode-list-hoverBackground)');
						it.addEventListener('mouseleave', () => it.style.background = 'transparent');
						it.addEventListener('click', () => {
							menu.style.display = 'none';
							if (currentItem) {
								vscode.postMessage({ command: cmd, item: currentItem.dataset.name, isDirectory: currentItem.dataset.isDirectory === 'true' });
							}
						});
						menu.appendChild(it);
					}

					let currentItem = null;

					document.addEventListener('contextmenu', (e) => {
						const item = e.target.closest('.item');
						if (item) {
							e.preventDefault();
							if (selectedItem) selectedItem.classList.remove('selected');
							item.classList.add('selected');
							selectedItem = item;
							currentItem = item;
							clearMenu();
							const isDir = item.dataset.isDirectory === 'true';
							if (isDir) {
								addMenuItem('Open Folder', 'openFolder');
								addMenuItem('New File', 'newFile');
								addMenuItem('New Folder', 'newFolder');
							} else {
								addMenuItem('Open', 'openFile');
								addMenuItem('Open to the Side', 'openToSide');
								addMenuItem('Copy Path', 'copyPath');
								addMenuItem('Delete', 'delete');
							}
							// position with some padding to avoid edges
							const x = Math.min(window.innerWidth - 180, e.clientX);
							const y = Math.min(window.innerHeight - 10, e.clientY);
							menu.style.left = x + 'px';
							menu.style.top = y + 'px';
							menu.style.display = 'block';
						} else {
							menu.style.display = 'none';
						}
					});

					// Hide menu when clicking outside
					document.addEventListener('click', (e) => {
						if (!e.target.closest('#context-menu')) { menu.style.display = 'none'; }
						const item = e.target.closest('.item');
						if (item) {
							if (selectedItem) selectedItem.classList.remove('selected');
							item.classList.add('selected');
							selectedItem = item;
						}
					});

					// Handle opening files/folders on double click
					document.addEventListener('dblclick', (e) => {
						const item = e.target.closest('.item');
						if (item) {
							if (item.dataset.isDirectory === 'true') {
								vscode.postMessage({ command: 'openFolder', item: item.dataset.name, isDirectory: item.dataset.isDirectory === 'true' });
							} else {
								vscode.postMessage({ command: 'openFile', item: item.dataset.name, isDirectory: item.dataset.isDirectory === 'true' });
							}
						}
					});

					// initialize view
					setView('list');
				}())
			</script>
		</body>
		</html>
	`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
