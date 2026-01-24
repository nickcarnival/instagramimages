# Instagram Image Extension

Chrome extension that extracts and displays Instagram images in a clean viewer with download capability.

## What Problem Does This Solve?

Instagram doesn't provide a simple way to view images in full quality or download them directly. When you right-click on an Instagram image, you can't easily "Open image in new tab". This was annoying me so this extension provides this default browser behavior.

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this folder

## Usage

### Basic Usage

Right-click on any Instagram page and select "Open Instagram Image" to view the image in a new tab with download option.

### Two-Page Flow

The extension uses two pages:

1. **Viewer Page** (`page.html`): Initial image display with download and CDN link options. Click the image to enter zoom mode.
2. **Zoom Page** (`zoom.html`): Advanced zoom interface with pan, zoom controls, and presets.

### Mouse Controls

- **Click image**: Enter zoom mode (zooms to 150% at click point)
- **Mouse wheel**: Zoom in/out at cursor position
- **Drag**: Pan the image around
- **Double-click**: Reset zoom to 50% and center image

### Keyboard Shortcuts

- **Escape**: Close zoom view and return to viewer
- **+** or **=**: Zoom in
- **-**: Zoom out
- **0**: Reset zoom to 50%

### Zoom Controls

- **Reset (⟲)**: Reset zoom to 50% and center image
- **Zoom In/Out (+/-)**: Adjust zoom by 25% increments
- **Zoom Input**: Manually enter zoom percentage (10% - 1000%)
- **Fit**: Fit image to screen
- **100%, 200%, 400%**: Quick zoom presets
- **Close (×)**: Return to viewer page

## Bugs

- Opening from the grid view does not work, it opens a random image. 🤷 IDC

