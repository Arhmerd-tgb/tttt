# Ashmie

Ashmie is a small product-focused SaaS starter with a Vite frontend and Express API. It includes a demo login, dashboard, pricing, workspace views, and a file-backed project store for local development.

## Features

- Vite frontend for the web UI
- Express API for auth, dashboard, pricing, and project data
- Demo user login flow
- Local JSON persistence for users and projects
- Render deployment configuration
- Basic Node test coverage

## Local development

### 1) Install dependencies

```bash
npm install
```

### 2) Start the app

```bash
npm run dev
```

This runs both the API and the frontend together.

### 3) Build the frontend

```bash
npm run build
```

### 4) Run the production server

```bash
npm run start
```

## Useful scripts

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run lint
npm run check
```

## Windows note

If PowerShell blocks script execution in this environment, run the commands with an explicit Node path or bypass the policy for the current session:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
npm install
npm run dev
```

Alternatively, you can run Node-based checks directly:

```powershell
node --test
```

## API overview

- `GET /api/health` — app health check
- `POST /api/auth/login` — demo login
- `POST /api/auth/signup` — create a new user
- `POST /api/auth/logout` — sign out request
- `GET /api/dashboard` — dashboard cards and metrics
- `GET /api/pricing` — pricing plan data
- `GET /api/workspace` — workspace metrics and project summaries
- `GET /api/projects` — project list
- `POST /api/projects` — create a project

## Environment variables

Use a local `.env` file based on `.env.example`:

```env
PORT=3001
VITE_APP_NAME=Ashmie
VITE_APP_TAGLINE=Launch elegant digital experiences with confidence.
VITE_APP_DESCRIPTION=A modern product starter with a polished frontend and a working backend API.
```

## Deployment

The project includes a Render config in [render.yaml](render.yaml). It builds the frontend and starts the Express server using the production command.

## Notes

This project is intended as a working starter for a product app. For production use, you should replace the file-based JSON store with a real database and secure the auth flow with hashed passwords and tokens.
