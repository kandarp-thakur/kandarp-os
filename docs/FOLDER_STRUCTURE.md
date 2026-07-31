# Folder Structure — Kandarp OS Full-Stack Platform

Paths are relative to the repository root.

```text
kandarp-os/
├── README.md                     # setup and project overview
├── CHANGELOG.md                  # release history
├── Dockerfile                    # production application image
├── docker-compose.yml            # local application + PostgreSQL
├── docker-compose.server.yml     # server deployment composition
├── next.config.mjs               # Next.js, CSP, headers, image policy
├── prisma.config.ts              # Prisma schema, migrations, seed command
├── package.json                  # scripts and dependencies
├── tsconfig.json                 # strict TypeScript and aliases
│
├── prisma/
│   ├── schema.prisma             # PostgreSQL data model
│   ├── seed.ts                   # idempotent RBAC, owner, and demo seed
│   └── migrations/               # immutable migration history
│
├── public/
│   ├── media/                    # local-storage media objects
│   └── opengraph-image.svg
│
├── docs/
│   ├── architecture.md           # full-stack runtime design
│   ├── FOLDER_STRUCTURE.md       # this guide
│   ├── deployment-vercel.md      # deployment guidance
│   ├── backend/
│   │   ├── README.md             # backend/admin operations
│   │   ├── api-reference.md      # route contract reference
│   │   ├── openapi.yaml          # machine-readable API specification
│   │   ├── security.md           # auth, RBAC, API keys, and controls
│   │   ├── configuration.md      # environment variables and providers
│   │   ├── media.md              # storage and image processing
│   │   └── logging.md            # structured logging
│   └── ...                       # UI, design, Three.js, and feature guides
│
└── src/
    ├── middleware.ts             # admin JWT gate, rate limit, CSRF, limits
    │
    ├── app/                      # Next.js App Router
    │   ├── (public)/             # public portfolio routes
    │   ├── admin/
    │   │   ├── login/            # authentication entry
    │   │   └── (console)/        # authenticated administration pages
    │   ├── api/
    │   │   ├── admin/            # cookie/session-authenticated APIs
    │   │   ├── v1/               # API-key-authenticated APIs
    │   │   ├── health/           # live and ready probes
    │   │   └── contact/          # public bounded contact submission
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    │
    ├── backend/
    │   ├── auth/                 # JWT, Argon2id, TOTP, sessions
    │   ├── cache/                # revalidation tags and invalidation
    │   ├── config/               # typed environment configuration
    │   ├── controllers/          # generic CRUD and HTTP orchestration
    │   ├── database/             # Prisma singleton
    │   ├── logging/              # Pino logging
    │   ├── middlewares/          # API auth, validation, request context
    │   ├── permissions/          # role matrix and per-user overrides
    │   ├── repositories/         # persistence and entity mapping
    │   ├── schemas/              # Zod contracts and entity types
    │   ├── security/             # encryption and TOTP utilities/tests
    │   ├── services/             # domain workflows and public CMS data
    │   └── storage/              # local/Cloudinary abstraction
    │
    ├── data/                     # typed defaults and seed source content
    │
    ├── features/
    │   ├── admin/                # admin shell, navigation, editors, tables
    │   ├── hero/                 # public hero and terminal
    │   ├── about/                # profile and achievements
    │   ├── experience/           # deployment timeline
    │   ├── projects/             # container-style portfolio
    │   ├── infrastructure/       # topology visualization
    │   ├── skills/               # skill graph
    │   ├── blog/                 # journal and MDX rendering
    │   ├── contact/              # contact UI and form
    │   ├── navigation/           # public navigation
    │   ├── footer/               # public footer
    │   ├── background/           # animated backgrounds
    │   ├── layout/               # layout primitives
    │   └── shared/               # reusable public components
    │
    ├── infrastructure/
    │   ├── providers/            # application providers
    │   ├── styles/               # public/admin design tokens
    │   └── three/                # React Three Fiber scenes and hooks
    │
    ├── lib/                      # public view helpers and terminal utilities
    └── packages/                 # reusable config, hooks, types, UI, utils
```

## Path Aliases

Aliases are defined in `tsconfig.json`.

| Alias | Target |
| --- | --- |
| `@/*` | `src/*` |
| `@backend/*` | `src/backend/*` |
| `@features/*` | `src/features/*` |
| `@packages/*` | `src/packages/*` |
| `@hooks/*` | `src/packages/hooks/*` |
| `@utils/*` | `src/packages/utils/*` |
| `@config/*` | `src/packages/config/*` |
| `@data/*` | `src/data/*` |
| `@lib/*` | `src/lib/*` |
| `@styles/*` | `src/infrastructure/styles/*` |
| `@providers` | `src/infrastructure/providers/index.tsx` |
| `@3d/*` | `src/infrastructure/three/*` |

## Placement Rules

- Route-specific composition belongs in `src/app`; reusable UI belongs in `src/features` or `src/packages/ui`.
- Database access belongs behind backend repositories/services, not public feature components.
- Request validation contracts belong in `src/backend/schemas`.
- Shared authentication and authorization belong in backend middleware and permission modules.
- Public pages consume stable view models from `src/backend/services/public-data.ts` rather than Prisma records.
- Migrations are append-only after deployment; schema changes require a new directory under `prisma/migrations`.
