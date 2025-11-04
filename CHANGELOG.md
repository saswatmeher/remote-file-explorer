# Changelog

All notable changes to the Remote File Explorer extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2025-11-04 (Pre-release)

### Added
- Thumbnail previews:
  - Images (jpg, jpeg, png, gif, bmp, webp, svg) shown directly in the webview
  - PDFs display a lightweight SVG preview (shows PDF version and file size)
- Grid view names now wrap up to 3 lines with an ellipsis at the end

### Changed
- Removed native `canvas` dependency to avoid GLIBC/snap compatibility issues
- Thumbnails implemented with a dependency‑free approach (webview URIs + SVG)
- Dynamically update webview `localResourceRoots` as you navigate, enabling image access

### Fixed
- Extension activation failure on systems with mismatched `librsvg`/Pango/GLIBC

## [0.2.0] - 2025-11-03 (Pre-release)

### Added
- Multi-selection support:
  - Ctrl+click to toggle selection
  - Shift+click to select ranges
  - Drag-select with a selection box, including add-to-selection with Ctrl
- Keyboard navigation and shortcuts:
  - Arrow keys to move focus (grid and list aware)
  - Shift + arrows to extend selection; Ctrl + arrows to move focus only
  - Space toggles selection of focused item
  - Enter opens files/folders (Shift+Enter opens folder in new tab)
  - Ctrl+C / Ctrl+X / Ctrl+V for Copy / Cut / Paste
  - Delete to delete selected items (with confirmation)
  - Ctrl+A select all, Escape clears selection, F2 renames single selection
- Context menu enhancements with grouped operations and separators:
  - Single-selection: Open, Rename | Copy, Cut, Paste | Delete
  - Multi-selection: Copy, Cut, Paste | Delete
- “Open” in context menu matches double‑click behavior

### Changed
- Webview UX improvements:
  - Prevent I‑beam cursor and disable text selection on items
  - Focus management so keyboard events always work (tabindex + autofocus)
  - Visible keyboard focus ring; visible drag-select preview state
- Drag selection persists after mouseup (no accidental clearing on click)

### Fixed
- Keyboard events not firing previously due to lack of focus in the webview
- Drag selection sometimes cleared by the subsequent click event

## [0.1.0] - 2025-10-27

### Added
- Initial release of Remote File Explorer extension
- Grid and list view modes for file/folder browsing
- Zoom controls for adjusting thumbnail sizes
- Context menu with Open File/Folder actions
- Navigation controls (Back/Forward/Up) with history tracking
- Double-click behavior:
  - Normal double-click: Open in same panel
  - Shift + double-click: Open in new panel
- File/folder name display improvements:
  - Grid view: Long names wrap to multiple lines
  - List view: Compact single-line with ellipsis
- Explorer context menu integration for quick access
- Commands:
  - `remoteFileExplorer.openInremoteFileExplorer`
  - `remoteFileExplorer.openInRemoteContainingFolder`

### Changed
- Updated README with comprehensive usage instructions
- Added MIT License

### Fixed
- Navigation history tracking for back/forward buttons
- Folder name display in grid view to handle long names