(function() {
	const vscode = acquireVsCodeApi();
	const selectedItems = new Set();
	let zoom = 100;
	let isDragging = false;
	let dragStartPos = { x: 0, y: 0 };
	let selectionBox = null;
	let lastSelectedItem = null; // Track last selected item for shift selection

	// Get UI elements
	const listBtn = document.getElementById('listBtn');
	const gridBtn = document.getElementById('gridBtn');
	const itemsEl = document.getElementById('items');
	const zoomIn = document.getElementById('zoomIn');
	const zoomOut = document.getElementById('zoomOut');
	const zoomLabel = document.getElementById('zoomLabel');
	const backBtn = document.getElementById('backBtn');
	const forwardBtn = document.getElementById('forwardBtn');
	const upBtn = document.getElementById('upBtn');

	// Navigation buttons event listeners
	backBtn.addEventListener('click', () => {
		vscode.postMessage({ command: 'navigate', direction: 'back' });
	});

	forwardBtn.addEventListener('click', () => {
		vscode.postMessage({ command: 'navigate', direction: 'forward' });
	});

	upBtn.addEventListener('click', () => {
		vscode.postMessage({ command: 'navigate', direction: 'up' });
	});

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
			case 'updateNavigation':
				// Update navigation buttons state
				backBtn.disabled = !message.canGoBack;
				forwardBtn.disabled = !message.canGoForward;
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
			
			// Get all selected items
			const selectedFiles = Array.from(selectedItems).map(item => ({
				name: item.dataset.name,
				isDirectory: item.dataset.isDirectory === 'true'
			}));

			// Send command with selected items
			vscode.postMessage({ 
				command: cmd, 
				items: selectedFiles,
				position: { x: menu.offsetLeft, y: menu.offsetTop }
			});
		});
		menu.appendChild(it);
	}

	let currentItem = null;

	document.addEventListener('contextmenu', (e) => {
		const item = e.target.closest('.item');
		if (item) {
			e.preventDefault();
			
			// If clicking on an unselected item, select it
			if (!selectedItems.has(item)) {
				selectItem(item);
			}

			clearMenu();

			// Get all selected items
			const selectedFiles = Array.from(selectedItems).map(item => ({
				name: item.dataset.name,
				isDirectory: item.dataset.isDirectory === 'true'
			}));

			// Add menu items based on selection
			if (selectedFiles.length === 1) {
				// Single item selected
				if (selectedFiles[0].isDirectory) {
					addMenuItem('Open', 'openFolder');
				} else {
					addMenuItem('Open', 'openFile');
				}
			}

			// Common operations for both single and multiple selections
			addMenuItem('Copy', 'copy');
			addMenuItem('Cut', 'cut');
			addMenuItem('Delete', 'delete');

			// Add paste option if there's something in clipboard
			vscode.postMessage({ command: 'checkClipboard' });

			// Position menu
			const x = Math.min(window.innerWidth - 180, e.clientX);
			const y = Math.min(window.innerHeight - 10, e.clientY);
			menu.style.left = x + 'px';
			menu.style.top = y + 'px';
			menu.style.display = 'block';
		} else {
			// Right click on empty space
			e.preventDefault();
			clearMenu();
			addMenuItem('Paste', 'paste');
			
			const x = Math.min(window.innerWidth - 180, e.clientX);
			const y = Math.min(window.innerHeight - 10, e.clientY);
			menu.style.left = x + 'px';
			menu.style.top = y + 'px';
			menu.style.display = 'block';
		}
	});

	// Hide menu when clicking outside
	// Create selection box for drag selection
	function createSelectionBox() {
		const box = document.createElement('div');
		box.id = 'selection-box';
		box.style.position = 'fixed';
		box.style.border = '1px solid var(--vscode-focusBorder)';
		box.style.backgroundColor = 'rgba(var(--vscode-focusBorder), 0.1)';
		box.style.pointerEvents = 'none';
		box.style.display = 'none';
		document.body.appendChild(box);
		return box;
	}

	function updateSelectionBox(e) {
		// Calculate the selection box dimensions
		const x = Math.min(e.clientX, dragStartPos.x);
		const y = Math.min(e.clientY, dragStartPos.y);
		const width = Math.abs(e.clientX - dragStartPos.x);
		const height = Math.abs(e.clientY - dragStartPos.y);
		
		// Apply the dimensions to the selection box
		selectionBox.style.left = x + 'px';
		selectionBox.style.top = y + 'px';
		selectionBox.style.width = width + 'px';
		selectionBox.style.height = height + 'px';

		// Show a preview of what will be selected
		const rect = selectionBox.getBoundingClientRect();
		const items = document.querySelectorAll('.item');
		
		items.forEach(item => {
			const itemRect = item.getBoundingClientRect();
			const isIntersecting = !(rect.right < itemRect.left || 
				rect.left > itemRect.right || 
				rect.bottom < itemRect.top || 
				rect.top > itemRect.bottom);

			// Add 'selecting' class for visual feedback during drag
			if (isIntersecting) {
				item.classList.add('selecting');
			} else {
				item.classList.remove('selecting');
			}
		});
	}

	function getItemsInRange(startItem, endItem) {
		const items = Array.from(document.querySelectorAll('.item'));
		const startIndex = items.indexOf(startItem);
		const endIndex = items.indexOf(endItem);
		
		if (startIndex === -1 || endIndex === -1) return [];
		
		const start = Math.min(startIndex, endIndex);
		const end = Math.max(startIndex, endIndex);
		
		return items.slice(start, end + 1);
	}

	function selectItem(item, options = { addToSelection: false, isShiftSelect: false }) {
		if (!options.addToSelection && !options.isShiftSelect) {
			// Clear previous selection if not adding to it
			selectedItems.forEach(i => i.classList.remove('selected'));
			selectedItems.clear();
		}

		if (options.isShiftSelect && lastSelectedItem) {
			// First clear any previous selections if not using Ctrl
			if (!options.addToSelection) {
				selectedItems.forEach(i => i.classList.remove('selected'));
				selectedItems.clear();
			}

			// Select all items in range
			const itemsInRange = getItemsInRange(lastSelectedItem, item);
			itemsInRange.forEach(rangeItem => {
				rangeItem.classList.add('selected');
				selectedItems.add(rangeItem);
			});
		} else {
			item.classList.add('selected');
			selectedItems.add(item);
			lastSelectedItem = item;
		}
	}

	// Initialize selection box
	selectionBox = createSelectionBox();

	// Mouse events for drag selection
	document.addEventListener('mousedown', (e) => {
		if (e.button === 0) { // Left click
			isDragging = true;
			dragStartPos = { x: e.clientX, y: e.clientY };
			
			// Prevent default text selection
			e.preventDefault();
			
			// If clicking on empty space and not using Ctrl/Shift, clear selection
			if (!e.target.closest('.item') && !e.ctrlKey && !e.shiftKey) {
				selectedItems.forEach(item => item.classList.remove('selected'));
				selectedItems.clear();
			}
		}
	});

	// Prevent text selection while dragging
	document.addEventListener('selectstart', (e) => {
		if (isDragging) {
			e.preventDefault();
		}
	});

	document.addEventListener('mousemove', (e) => {
		if (isDragging) {
			if (!selectionBox.style.display || selectionBox.style.display === 'none') {
				// Only start showing selection box if mouse has moved a minimum distance
				const dx = Math.abs(e.clientX - dragStartPos.x);
				const dy = Math.abs(e.clientY - dragStartPos.y);
				if (dx > 5 || dy > 5) {
					selectionBox.style.display = 'block';
				}
			}
			updateSelectionBox(e);
		}
	});

	document.addEventListener('mouseup', (e) => {
		if (isDragging) {
			isDragging = false;
			if (selectionBox) {
				selectionBox.style.display = 'none';
				
				// If selection box was actually shown (drag occurred), finalize the selection
				if (selectionBox.style.display === 'block') {
					const rect = selectionBox.getBoundingClientRect();
					const items = document.querySelectorAll('.item');
					
					// If not using Ctrl, clear previous selection
					if (!e.ctrlKey) {
						selectedItems.forEach(item => item.classList.remove('selected'));
						selectedItems.clear();
					}
					
					// Select all items within the selection box
					items.forEach(item => {
						const itemRect = item.getBoundingClientRect();
						if (!(rect.right < itemRect.left || 
							rect.left > itemRect.right || 
							rect.bottom < itemRect.top || 
							rect.top > itemRect.bottom)) {
							item.classList.add('selected');
							selectedItems.add(item);
						}
					});
					
					// Update last selected item for shift-selection
					if (selectedItems.size > 0) {
						lastSelectedItem = Array.from(selectedItems).pop();
					}
				}
			}
		}
	});

	// Handle clicks on items
	document.addEventListener('click', (e) => {
		if (!e.target.closest('#context-menu')) { 
			menu.style.display = 'none';
		}
		
		const item = e.target.closest('.item');
		if (item) {
			if (e.shiftKey) {
				// Shift+click for range selection
				selectItem(item, { 
					addToSelection: e.ctrlKey, 
					isShiftSelect: true 
				});
			} else if (e.ctrlKey) {
				// Toggle selection with Ctrl+click
				if (selectedItems.has(item)) {
					item.classList.remove('selected');
					selectedItems.delete(item);
					// Update lastSelectedItem if we're deselecting it
					if (lastSelectedItem === item) {
						lastSelectedItem = Array.from(selectedItems).pop() || null;
					}
				} else {
					selectItem(item, { addToSelection: true });
				}
			} else {
				// Normal click
				selectItem(item);
			}
		} else if (!e.ctrlKey && !e.shiftKey) {
			// Click on empty space clears selection unless Ctrl or Shift is held
			selectedItems.forEach(i => i.classList.remove('selected'));
			selectedItems.clear();
			lastSelectedItem = null;
		}
	});

	// Handle opening files/folders on double click
	document.addEventListener('dblclick', (e) => {
		const item = e.target.closest('.item');
		if (item) {
			if (item.dataset.isDirectory === 'true') {
				vscode.postMessage({ 
					command: 'openFolder', 
					item: item.dataset.name, 
					isDirectory: item.dataset.isDirectory === 'true',
					newTab: e.shiftKey // Pass whether shift key was pressed
				});
			} else {
				vscode.postMessage({ command: 'openFile', item: item.dataset.name, isDirectory: item.dataset.isDirectory === 'true' });
			}
		}
	});

	// initialize view
	setView('grid');
}());
