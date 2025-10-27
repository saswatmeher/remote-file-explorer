# Changelog

All notable changes to the Remote File Explorer extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-27

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