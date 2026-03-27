# Kanban Board

A private, encrypted Kanban board that runs as a desktop app on Windows and Mac. All data is stored in a `.kanban` file on your own machine — nothing is ever sent to a server or stored in the cloud.

---

## How it works

### Boards and files
Each board is saved as a single `.kanban` file that you choose where to store (Desktop, Documents, USB drive, etc). You can have as many boards as you like, each with its own password and file. Opening the app presents a welcome screen where you create a new board or open an existing one.

### Encryption
Every `.kanban` file is fully encrypted before it is written to disk. The encryption stack:

| Layer | Detail |
|---|---|
| **Algorithm** | AES-256-GCM — the same standard used by banks and governments |
| **Key derivation** | PBKDF2 with SHA-256, 100,000 iterations |
| **Salt** | 16 random bytes, unique per save — means two saves of identical data produce different ciphertext |
| **IV (nonce)** | 12 random bytes, unique per save |
| **Authentication** | GCM mode provides built-in tamper detection — any modification to the file is detected on open |

When you enter your password, it is run through PBKDF2 to derive a 256-bit AES key. The 100,000 iterations make brute-force attacks extremely slow — guessing 1 billion passwords per second would take thousands of years to crack a strong password.

The `.kanban` file contains only: a 4-byte magic header, the salt, the IV, and the encrypted ciphertext. Your password is never stored anywhere.

### Auto-save
The app watches for any change to your board (moving a card, editing a description, adding a comment) and automatically saves the encrypted file within ~700ms. The header bar shows the save status at all times (`✓ Saved 14:32`, `● Unsaved`, `● Saving…`).

### What the app can see
- The Electron shell (the desktop wrapper) can read and write files, but only to the path you explicitly chose when you created or opened the board.
- Your password and decrypted board data exist only in memory while the app is open. When you lock the board or close the app, they are gone.
- No analytics, no telemetry, no network requests of any kind.

---

## Features

- **Multiple boards** — each board is a separate encrypted file with its own password
- **Columns** — customisable columns (To Do, In Progress, Done, or anything you like)
- **Cards** — title, description, booking code, project, task type, priority (High / Medium / Low), due date, labels
- **Comments** — timestamped comments on each card with hours logging
- **Labels** — custom colour-coded labels, filterable
- **Filter bar** — filter by label, project, due date, or priority across the whole board
- **Dark mode** — toggle in the header, preference saved locally
- **Markdown** — descriptions and comments support `**bold**`, `*italic*`, `` `code` ``, and bullet lists
- **Export snapshot** — export a read-only static HTML copy of your board (unencrypted — for sharing or printing)
- **Password change** — change your board password at any time without losing data
- **Recent files** — quick access to recently opened boards on the welcome screen

---

## Requirements

Install **Node.js** (one-time setup): https://nodejs.org — download the LTS version and run the installer.

---

## Setup (run once after cloning)

```
npm install
```

## Run the app

```
npm start
```

## Build installers

```
# Windows (.exe installer + portable .exe)
npm run build:win

# Mac (.dmg for Intel + Apple Silicon)
npm run build:mac
```

Output goes to the `dist/` folder:

| File | Use |
|---|---|
| `Kanban Board Setup 1.0.0.exe` | Windows installer (recommended) |
| `Kanban Board 1.0.0.exe` | Windows portable — no install needed, just run |
| `Kanban Board-1.0.0.dmg` | Mac Intel installer |
| `Kanban Board-1.0.0-arm64.dmg` | Mac Apple Silicon (M1/M2/M3/M4) installer |

---

## File structure

```
main.js        — Electron main process (window, file dialogs, disk read/write)
preload.js     — Secure IPC bridge between the UI and Node.js
kanban.html    — The entire application (UI, crypto, state, rendering)
package.json   — Dependencies and build config
```

The entire application logic lives in `kanban.html` — it can also be opened directly in Chrome as a standalone web app with full functionality (File System Access API required).

---

## Security notes

- Use a strong, unique password — the encryption is only as strong as your password
- The export snapshot feature produces an **unencrypted** HTML file — treat it like a plain text document
- If you lose your password there is no recovery — there is no backdoor, no reset, no master key
- Clearing browser data does not affect the `.kanban` file — it lives on your filesystem where you saved it
