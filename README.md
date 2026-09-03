# Horizon360 — Admin / Super Admin (Web)

Back-office de la plateforme de gestion événementielle africaine **Horizon360**, destiné aux **Super Admin** et **Admin / Organisateurs**.

Interface premium, professionnelle et scalable : SaaS/Enterprise d'abord, avec une identité africaine subtile (terracotta, vert profond, or, ivoire).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — Design System centralisé par tokens CSS
- **TanStack Query** (données serveur) + **Zustand** (état client / auth)
- **TanStack Table** patterns via `DataTable`, **Recharts** (visualisation)
- **React Hook Form** + **Zod** (formulaires)
- **lucide-react** (icônes), **date-fns** (dates)
- i18n maison **FR / EN**, devise **FCFA (XOF)** par défaut

## Démarrage

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
npm run lint     # lint
```

### Comptes de démonstration

| Rôle | E-mail | Mot de passe |
|------|--------|--------------|
| Super Admin | `superadmin@horizon360.africa` | `horizon360` |
| Admin | `admin@bamakoevents.ml` | `horizon360` |

## Architecture

```
src/
├── app/                # App Router : login, (dashboard) group, pages, layouts
├── components/
│   ├── ui/             # Primitives réutilisables (Button, DataTable, Modal…)
│   ├── charts/         # Wrappers Recharts
│   └── layout/         # Sidebar, Topbar, GlobalSearch, DashboardShell
├── features/           # Logique métier par domaine (dashboard, events, promotions)
├── hooks/              # useRequireAuth, useListQuery, useDebounce
├── services/           # Couche API-ready (eventService, orderService…)
├── api/                # Client HTTP + mock resolver
├── mocks/              # Données fictives cohérentes
├── store/              # Zustand (auth, toast)
├── constants/          # Navigation (RBAC), statuts
├── i18n/               # Dictionnaires FR/EN + provider
├── types/              # Types du domaine
└── utils/              # cn, format (FCFA/dates), export CSV
```

## API-ready

Les composants ne contiennent aucune donnée en dur : tout passe par `src/services`.
Aujourd'hui, les services résolvent depuis `src/mocks` via `mockResolve()`.
Pour brancher le backend Horizon360, remplacez `mockResolve(...)` par `request(...)`
dans `src/services/index.ts` — les signatures restent identiques.

Variables d'environnement (voir `.env.example`) :

- `NEXT_PUBLIC_API_URL` — base URL de l'API
- `NEXT_PUBLIC_USE_MOCKS` — `false` pour désactiver les mocks

## Sécurité & RBAC

Le frontend masque les fonctionnalités non autorisées (`SUPER_ADMIN` vs `ADMIN`) via
`navForRole()` et `useRequireAuth(roles)`. **Les permissions doivent également être
contrôlées côté backend** — le frontend n'est jamais l'unique barrière de sécurité.
