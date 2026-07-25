# SafeGuard — Risk Classification System

Sistema de classificação e consulta de riscos em segurança do trabalho.

## Stack

### Frontend
- **React 19** + **TypeScript**
- **Vite 6** (build tool)
- **TailwindCSS v4** (styling)
- **TanStack Query v5** (server state)
- **Zod** (validation)
- **Recharts** (charts)
- **React Router v7** (routing)
- **Axios** (HTTP client)

### Backend
- _Em desenvolvimento_

## Getting Started

```bash
# Frontend
cd frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

## Project Structure

```
safe-guard/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── @types/    # TypeScript type definitions
│   │   ├── components/# Shared UI components
│   │   ├── hooks/api/ # API consumer hooks (TanStack Query)
│   │   ├── pages/     # Page components (Report, Result, Dashboard)
│   │   ├── schemas/   # Zod validation schemas
│   │   ├── providers/ # React Context providers (Theme, Query)
│   │   ├── lib/       # Utilities, constants, axios client
│   │   └── styles/    # TailwindCSS globals + design tokens
│   └── ...
├── backend/           # API server (TBD)
└── README.md
```

## Design System

- **Brand**: Sahara Safety Protocol — Warm Minimalism
- **Font**: Manrope
- **Icons**: Material Symbols Outlined
- **Theme**: Light (default) + Dark mode toggle
- **Colors**: Material Design 3 tokens with terracotta primary

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3001/api
```
