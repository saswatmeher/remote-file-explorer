# Remote File Explorer — VS Code Extension

Remote File Explorer is a lightweight VS Code extension that opens a browsable file explorer in a Webview panel. It provides a compact visual file browser similar to a desktop file manager.

![How to open the file explorer](https://raw.githubusercontent.com/saswatmeher/remote-file-explorer/refs/heads/main/assets/demo-ss-1.png)

## Key features

- Grid and list views for browsing files and folders
- Zoom controls (increase/decrease thumbnail size)
- Double-click behavior:
	- Double-click a folder: opens in the same webview panel
	- Shift + double-click a folder: opens in a new panel/tab
- Back / Forward / Up navigation with history tracking
- Open files in the main editor from the webview

## Commands

The primary (and most convenient) way to open the Remote File Explorer is via the Explorer context menu — right-click any file or folder in the VS Code Explorer and choose "Open in Remote File Explorer" (this runs the `remoteFileExplorer.openInremoteFileExplorer` command for the selected resource).

The extension exposes these commands (use the Command Palette or bind keys):
- `remoteFileExplorer.openInremoteFileExplorer` — Open a specific folder in the Remote File Explorer (prompts for a path if none provided)
- `remoteFileExplorer.openInRemoteContainingFolder` — Open the containing folder of the currently active file

## Roadmap

These features are planned for future releases:

### High Priority
- **File Management Operations**
  - Multiple file/folder selection (Click + Shift/Ctrl)
  - Cut, Copy, Paste operations
  - Delete files/folders with confirmation
  - Rename files/folders
- **Thumbnail Support**
  - Implement FreeDesktop thumbnail specifications
  - Generate thumbnails for images, PDFs, and videos
  - Cache thumbnails according to freedesktop.org guidelines
  - Support both normal and large thumbnail sizes

### Nice to Have
- Drag and drop support between panels
- File/folder creation from context menu
- List view columns (size, date modified, etc.)
- File type filtering
- Search within current folder
- Keyboard shortcuts for all operations
- Sort by (Date, Name, etc...)

## Contributing

Contributions are welcome. Open issues or PRs for bugs and feature requests. Keep changes focused and include tests where relevant.

## License

This project is licensed under the MIT License — see the `LICENSE` file at the project root for the full text.

---

If you'd like, I can also add a short 'Try it' example to the README that includes sample commands and screenshots (if you provide images).
