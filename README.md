# Kanban Board

A private, encrypted Kanban board that runs as a desktop app on Windows and Mac. All data is stored in a `.kanban` file on your own machine — nothing is ever sent to a server or stored in the cloud.

---

## Design philosophy

Most productivity apps store your data on someone else's server. That means the company can read it, lose it in a breach, go out of business, or change their pricing. This app takes the opposite approach — your data never leaves your machine, and the file it produces is encrypted so strongly that even if someone stole it they could not read it without your password.

The entire application is written as a single HTML file. This is a deliberate choice:

- **You can read every line of it.** There is no compiled binary, no minified bundle, no hidden behaviour. If you want to verify what the app does with your data, open `kanban.html` in a text editor.
- **Zero runtime dependencies.** No npm packages running at runtime means no supply chain risk — a compromised third-party package cannot steal your data.
- **Portable.** The same file works as a desktop app (via Electron) or directly in Chrome/Edge on any machine.

This pattern is well established — TiddlyWiki has used a single HTML file for private notes since 2004.

---

## How the encryption works

Every `.kanban` file is fully encrypted before it is written to disk. Opening the file in a hex editor shows only random bytes — no structure, no metadata, no readable text.

### The encryption stack

| Layer | Detail |
|---|---|
| **Algorithm** | AES-256-GCM — the same standard used by banks, governments, and Signal |
| **Key derivation** | PBKDF2-SHA256, 600,000 iterations |
| **Salt** | 16 random bytes, unique per save |
| **IV / nonce** | 12 random bytes, unique per save |
| **Authentication** | GCM provides built-in tamper detection |

### Why each piece matters

**AES-256-GCM** encrypts your data and simultaneously signs it. If anyone modifies even a single byte of your `.kanban` file — by accident or on purpose — the app will detect it and refuse to open the file. You cannot silently corrupt or tamper with the data.

**PBKDF2 with 600,000 iterations** makes brute-force attacks extremely slow. When you type your password, the app runs it through 600,000 rounds of hashing before deriving the encryption key. This takes about half a second on a fast machine — barely noticeable to you, but devastating for an attacker trying millions of guesses. At 600,000 iterations a modern computer can test roughly 30,000 passwords per second. A random 12-character password would take longer than the age of the universe to crack.

**Random salt on every save** means two saves of identical data produce completely different ciphertext. An attacker cannot compare two files to learn anything about what changed.

**Your password is never stored anywhere.** Not in the file, not on disk, not in memory after you lock the board. The `.kanban` file contains only: a 4-byte magic header, the salt, the IV, and the encrypted ciphertext.

### What the file looks like on disk

```
Bytes 0–3    Magic header (identifies file format)
Bytes 4–19   Salt (16 random bytes)
Bytes 20–31  IV / nonce (12 random bytes)
Bytes 32+    Encrypted ciphertext (AES-256-GCM)
```

---

## Threat model — what this protects against

### ✅ Protected

**Someone steals or finds your `.kanban` file**
The file is useless without your password. With a strong password and 600,000 PBKDF2 iterations, brute-force is not feasible in any practical timeframe.

**Someone tampers with your `.kanban` file**
GCM authentication detects any modification. The app will refuse to open a tampered file.

**Hard drive is stolen or recovered**
Same as above — the file is encrypted at rest.

**Someone inspects the app code looking for a backdoor**
There is none, and because the entire app is one readable HTML file, you can verify this yourself.

### ⚠️ Partially protected

**Malware already running on your machine**
If your computer is already compromised by malware with admin access, no local app can fully protect you — the malware could log your keystrokes and capture your password as you type it. This is true of all local encryption tools including VeraCrypt and 1Password. The mitigation is keeping your OS and antivirus up to date.

**Someone with physical access to your unlocked laptop**
If you walk away with the board open, your data is visible. Use the Lock button when stepping away.

### ❌ Not the right tool for

**Sharing sensitive data with other people**
The app is designed for one person. The snapshot export feature produces an unencrypted HTML file — treat it like a plain text document.

**Regulatory compliance (HIPAA, GDPR, SOC 2, etc.)**
This is a personal productivity tool, not an audited compliance solution.

---

## Electron security design

The desktop app uses a strict three-layer architecture:

```
kanban.html (UI)  ←→  preload.js (bridge)  ←→  main.js (Node.js)  ←→  Disk
```

- **`nodeIntegration: false`** — the UI cannot call Node.js APIs directly
- **`contextIsolation: true`** — the UI runs in a completely separate JavaScript context from the bridge
- **`sandbox: true`** — the renderer process is OS-level sandboxed

The bridge (`preload.js`) exposes exactly four functions to the UI: open file dialog, save file dialog, read a file, write a file. Nothing else. The UI cannot run shell commands, access the network, read arbitrary files, or touch the system.

---

## Features

- **Multiple boards** — each board is a separate encrypted file with its own password
- **Columns** — fully customisable (To Do, In Progress, Done, or anything you like)
- **Cards** — title, description, booking code, project, task type, priority (High / Medium / Low), due date, labels
- **Comments** — timestamped comments on each card with hours logging
- **Labels** — custom colour-coded labels, filterable
- **Filter bar** — filter by label, project, due date, or priority across the whole board
- **Dark mode** — toggle in the header, preference saved locally
- **Markdown** — descriptions and comments support `**bold**`, `*italic*`, `` `code` ``, and bullet lists
- **Time report** — summary of hours logged across all cards and boards
- **Export snapshot** — read-only static HTML copy of your board for sharing or printing (unencrypted)
- **Password change** — change your board password at any time without losing data
- **Recent files** — quick access to recently opened boards on the welcome screen
- **Auto-save** — changes are saved to disk within ~700ms automatically

---

## Requirements

Install **Node.js** (one-time setup): https://nodejs.org — download the LTS version and run the installer.

---

## Setup

```bash
# Clone the repo
git clone https://github.com/bpc-1/kanban.git
cd kanban

# Install build dependencies (one time only)
npm install
```

## Run without building

```bash
npm start
```

## Build installers

```bash
# Windows — produces .exe installer and portable .exe
npm run build:win

# Mac — produces .dmg for Intel and Apple Silicon
npm run build:mac
```

Output goes to the `dist/` folder:

| File | Use |
|---|---|
| `Kanban Board Setup 1.0.0.exe` | Windows installer (recommended) |
| `Kanban Board 1.0.0.exe` | Windows portable — no install needed |
| `Kanban Board-1.0.0.dmg` | Mac Intel |
| `Kanban Board-1.0.0-arm64.dmg` | Mac Apple Silicon (M1/M2/M3/M4) |

---

## File structure

```
main.js        Electron main process — window creation, file dialogs, disk I/O
preload.js     Secure IPC bridge between UI and Node.js
kanban.html    The entire application — UI, encryption, state, rendering
package.json   Dependencies and build configuration
```

---

## Important security notes

- **Use a strong password** — at least 12 characters, mix of letters, numbers, and symbols. The encryption is only as strong as your password.
- **There is no password recovery.** No backdoor, no reset link, no master key. If you forget your password your data is gone.
- **The snapshot export is unencrypted.** Treat exported snapshot files the same as plain text — do not email them or leave them in shared folders.
- **Lock the board when stepping away** — the Lock button in the header clears the password from memory immediately.
