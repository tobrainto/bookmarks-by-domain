# Bookmarks by Domain

## Why this exists

Over the years, my bookmarks quietly turned into a graveyard.

Articles I meant to read. Tools I wanted to try. Docs I thought I’d need again.
Everything went in — and almost nothing came back out.

I tried organizing them the “right” way: folders, hierarchies, categories.
But that always felt like maintenance work rather than something that actually helped me *use* my bookmarks.

The problem wasn’t just scale — it was the mental model.

Folders force you to decide *where something belongs*.
But bookmarks aren’t always that clear. A tool can be “dev”, “design”, or “inspiration” depending on context.

What finally clicked was this:

> Instead of organizing bookmarks by **what they are**, group them by **where they come from**.

When you look at bookmarks by domain:

* You immediately see accumulation
* You recognize patterns
* You can clean up in batches instead of one-by-one decisions

It turns bookmarks from a tree you manage into a surface you can *scan and prune*.

This project is that view.

---

## Features

* **Grouped by domain** — bookmarks organized and sorted by count
* **Search** — filter by domain, bookmark name, or URL (press `/` to focus)
* **Sort** — toggle between by count (default) and alphabetical
* **Delete mode** — reveal delete buttons for bookmarks and entire domains
* **Delete all matching** — bulk delete everything currently filtered
* **Smooth interactions** — subtle animations + sound feedback on deletion
* **Favicon support** — auto-fetch with graceful fallback

---

## Usage

* Use search (`/`) to quickly find anything
* Scan domains to spot over-saved sites
* Clean up in batches instead of one by one

---

## Principles

* **Local-first** — no server, no account, no external API calls
* **Private by default** — your data never leaves your browser
* **Zero setup** — install and it just works

---

## Tech

* **Vanilla JS** — no frameworks, no build step
* **Chrome Bookmarks API** — direct access to your bookmarks
* **Local-first** — everything runs entirely in your browser

---

## Installation

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** and select the `extension/` folder
4. Open the extension to access the full-page bookmark view

---

## Keyboard Shortcuts

| Key      | Action                          |
| -------- | ------------------------------- |
| `/`      | Focus search                    |
| `Escape` | Clear search + exit delete mode |

---

## Contributing

PRs and ideas are welcome.

---

## License

MIT © Tobrainto

---

## Author

Built by [Tobrainto](https://x.com/tobrainto)
