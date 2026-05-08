# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Chrome Bookmark Manager — a Chrome extension that displays bookmarks grouped by domain, with search, sort, and delete capabilities.

## Chrome Extension

Located in `extension/`. To install:
1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode" (top right)
3. Click "Load unpacked" and select the `extension/` folder
4. Click the extension icon to open the full-page bookmark viewer

Features:
- Bookmarks grouped by domain, sorted by count
- **Delete Mode**: toggle to reveal delete buttons on each bookmark and each domain
- **Search**: filter by domain, bookmark name, or URL (press `/` to focus)
- **Sort**: by count (default) or alphabetically
- **Delete all matching**: when searching, delete all visible bookmarks at once
- All deletions are applied immediately via Chrome's bookmarks API

## Key Files

| File | Description |
|------|-------------|
| `extension/manifest.json` | Extension manifest (MV3) |
| `extension/background.js` | Opens full page when extension icon clicked |
| `extension/page.html` | Full-page bookmark viewer (HTML + CSS) |
| `extension/page.js` | Bookmark loading, rendering, search, and delete logic |
