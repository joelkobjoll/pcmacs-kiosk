# pcmacs-kiosk

A digital signage kiosk system for Raspberry Pi. Display media, images, videos, and web pages on a TV. Manage content from any device on your local network.

## What is this?

- **Display Mode** (`/display`): Full-screen slideshow that runs on the kiosk TV. No browser chrome. Auto-advances through slides.
- **Admin Panel** (`/admin`): Manage playlists, upload media, and configure settings. Accessible from any device on the local network.
- **First-boot Setup**: On first launch, you'll be prompted to set an admin password before accessing the panel.

---

## Quick Start (Development)

### Prerequisites
- Node.js 22+
- pnpm 10+

```bash
cd pcmacs-kiosk
pnpm install
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3000

---

## Raspberry Pi Setup

### One-shot provisioning

```bash
git clone <repo-url> /home/pi/pcmacs-kiosk
sudo KIOSK_USER=pi KIOSK_DIR=/home/pi/pcmacs-kiosk bash scripts/setup-pi.sh
```

This will:
1. Install Node.js, pnpm, Chromium
2. Build the project
3. Install and enable the systemd service

### Manual start

```bash
pnpm build
bash scripts/start.sh
```

### Start on boot

```bash
sudo bash scripts/install-service.sh
sudo systemctl start pcmacs-kiosk
```

---

## Accessing the Admin Panel

Once running, the admin panel is accessible from **any device on your local network**:

```
http://<pi-ip-address>:3000/admin
```

The Pi's IP is shown in the terminal on startup. You can also find it with:

```bash
hostname -I
```

---

## Environment Variables

| Variable      | Default                          | Description                        |
|---------------|----------------------------------|------------------------------------|
| `PORT`        | `3000`                           | API server port                    |
| `BIND_HOST`   | `0.0.0.0`                        | Network interface to bind to       |
| `DB_PATH`     | `data/kiosk.db`                  | SQLite database file path          |
| `UPLOADS_DIR` | `uploads/`                       | Directory for uploaded media files |
| `JWT_SECRET`  | `pcmacs-kiosk-secret-change-me`  | JWT signing secret (change this!)  |
| `BASE_URL`    | *(empty)*                        | Base URL prefix for media URLs     |

> ⚠️ **Important**: Set `JWT_SECRET` to a strong random value in production.

---

## Architecture

Clean Architecture inside vertical slices. Each API feature owns four layers:

```
features/<name>/
  domain/           # Entities + repository interfaces (zero deps)
  application/      # Use cases with constructor DI (depends on domain only)
  infrastructure/   # Implements domain interfaces (SQLite, bcrypt, multer)
  presentation/     # Express route factory (depends on application only)
```

`main.ts` is the **composition root** — the only place that wires layers together.

---

## Project Structure

```
pcmacs-kiosk/
├── apps/
│   ├── api/                   # Express + SQLite backend
│   │   └── src/
│   │       ├── features/
│   │       │   ├── auth/      # domain/ application/ infrastructure/ presentation/
│   │       │   ├── slides/    # domain/ application/ infrastructure/ presentation/
│   │       │   ├── media/     # domain/ application/ infrastructure/ presentation/
│   │       │   └── settings/  # domain/ application/ infrastructure/ presentation/
│   │       ├── infrastructure/
│   │       │   └── database/  # DB connection + migrations
│   │       ├── shared/        # Middleware, utilities, types
│   │       └── main.ts        # Composition root — wires all layers
│   └── web/                   # Vite + React frontend
│       └── src/
│           ├── features/      # Vertical slices (auth, playlist, media, settings, display)
│           ├── shared/        # UI components, hooks, utilities
│           └── app/           # Router, providers, guards
├── scripts/                   # start.sh, setup-pi.sh, install-service.sh
├── systemd/                   # Service unit template
├── biome.json                 # Linting + formatting config
├── turbo.json                 # Turborepo task pipeline
├── GUIDELINES.md              # Coding standards
└── AGENTS.md                  # AI agent instructions
```

---

## Building for Production

```bash
pnpm build
# Then start the API (which also serves the web build):
node apps/api/dist/main.js
```
