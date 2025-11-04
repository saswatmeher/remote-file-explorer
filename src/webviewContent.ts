import * as vscode from 'vscode';
import { getFileIconClass } from './fileIcons';
import * as path from 'path';

export function getWebviewContent(
    items: { name: string; isDirectory: boolean; fullPath?: string; thumbnailUri?: string }[],
    webview: vscode.Webview,
    extensionUri: vscode.Uri
): string {
    const listItems = items
        .map(
            (item) => {
                const iconClass = item.isDirectory ? 'icon-folder' : getFileIconClass(item.name);
                const hasThumbnail = item.thumbnailUri ? 'has-thumbnail' : '';
                const thumbnailStyle = item.thumbnailUri ? `style="background-image: url('${item.thumbnailUri}')"` : '';
                
                return `
		<div class="item ${item.isDirectory ? 'folder' : 'file'} ${hasThumbnail}" data-name="${item.name}" data-is-directory="${item.isDirectory}">
			<div class="thumb ${iconClass}" ${thumbnailStyle}></div>
			<div class="name">${item.name}</div>
		</div>`;
            }
        )
        .join('');

    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'styles.css'));
    const fileIconsCssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'file-icons.css'));
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'webview.js'));
    const nonce = getNonce();

    return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>File Explorer</title>
			<link rel="stylesheet" href="${cssUri}">
			<link rel="stylesheet" href="${fileIconsCssUri}">
		</head>
		<body tabindex="0">
			<div class="toolbar">
				<div class="nav-controls">
					<button id="backBtn" class="btn" title="Go back">←</button>
					<button id="forwardBtn" class="btn" title="Go forward">→</button>
					<button id="upBtn" class="btn" title="Go to parent folder">↑</button>
				</div>
				<div class="view-controls">
					<button id="listBtn" class="btn" title="List view">List</button>
					<button id="gridBtn" class="btn active" title="Grid view">Grid</button>
				</div>
				<div class="controls">
					<button id="zoomOut" class="btn" title="Zoom out">-</button>
					<span id="zoomLabel">100%</span>
					<button id="zoomIn" class="btn" title="Zoom in">+</button>
				</div>
			</div>

			<div id="items" class="wrap grid" tabindex="-1">
				${listItems}
			</div>

			<script nonce="${nonce}" src="${jsUri}"></script>
		</body>
		</html>`;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
