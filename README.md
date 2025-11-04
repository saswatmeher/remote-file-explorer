# Remote File Explorer — VS Code Extension

VS Code doesn’t support “Open Containing Folder” in remote SSH sessions — Remote File Explorer fills that gap with a lightweight, Webview-based file browser that feels just like a desktop file manager.

⚠️ Disclaimer

I’ve never written a line of JavaScript in my life.
Every bit of code you see here was gently whispered into existence by Copilot.
I just clicked Accept Suggestion with conviction.

![How to open the file explorer](https://raw.githubusercontent.com/saswatmeher/remote-file-explorer/refs/heads/main/assets/demo-ss-1.png)

## Key features

- Grid and list views for browsing files and folders
- Zoom controls (increase/decrease thumbnail size)
- Color‑coded file type icons (inline SVGs, no external fonts)
- Thumbnails:
  - Images (jpg, jpeg, png, gif, bmp, webp, svg) shown as live previews
  - PDFs show a lightweight SVG preview (version + size)
- Double-click behavior:
	- Double-click a folder: opens in the same webview panel
	- Shift + double-click a folder: opens in a new panel/tab
- Back / Forward / Up navigation with history tracking
- Open files in the main editor from the webview

### Name wrapping (grid view)
- File/folder names wrap up to 3 lines and then ellipsis (…) is applied.
- List view keeps single‑line names with ellipsis for compactness.

## Commands

The primary (and most convenient) way to open the Remote File Explorer is via the Explorer context menu — right-click any file or folder in the VS Code Explorer and choose "Open in Remote File Explorer" (this runs the `remoteFileExplorer.openInremoteFileExplorer` command for the selected resource).

The extension exposes these commands (use the Command Palette or bind keys):
- `remoteFileExplorer.openInremoteFileExplorer` — Open a specific folder in the Remote File Explorer (prompts for a path if none provided)
- `remoteFileExplorer.openInRemoteContainingFolder` — Open the containing folder of the currently active file

## Roadmap

These features are planned for future releases:

### High Priority
- **Better Thumbnailing**
  - True raster thumbnails (e.g., first‑page PDF preview) while staying cross‑platform
  - Explore canvas or alternative approaches (e.g., pdf.js, WASM image/PDF renderers)
  - Optional caching aligned with FreeDesktop.org specs (`~/.cache/thumbnails/…`)
  - Consider video thumbnails (ffmpeg/wasm based) behind a setting

### Notes on current implementation
- No native dependencies. Images are served directly via webview URIs.
- PDF thumbnails are SVG previews (metadata‑based), not rendered pages—keeps the
  extension portable and avoids GLIBC/snap incompatibilities for now.

### Nice to Have
- Drag and drop support between panels
- File/folder creation from context menu
- List view columns (size, date modified, etc.)
- File type filtering
- Search within current folder
- Sort by (Date, Name, etc...)

## Contributing

Contributions are welcome. Open issues or PRs for bugs and feature requests. Keep changes focused and include tests where relevant.

## License

This project is licensed under the MIT License — see the `LICENSE` file at the project root for the full text.
