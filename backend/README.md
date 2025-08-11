# theatre-app backend

Modernized backend using Fastify + TypeScript + Drizzle ORM + Zod.

## Stack
- Fastify 4
- TypeScript 5
- Drizzle ORM (PostgreSQL)
- Zod (validation, types)
- Vitest (unit)
- Playwright (API e2e)
- Docker and docker-compose

## Development

1. Copy env and set secrets

```
cp .env.example .env
```

2. Start dev stack (use debug compose for hot reload):

```
docker compose -f docker-compose.debug.yml up --build
```

3. Run migrations/generate (inside backend container or locally):

```
npm run drizzle:generate
npm run drizzle:migrate
```

4. Tests
- Unit tests:
```
npm run test:unit
```
- E2E (spins up ephemeral Postgres container, seeds data, starts server, produces HTML/JSON reports under `playwright-report/`):
```
npm run test:e2e
```
- All tests:
```
npm run test:all
```

Open HTML report:
```
npx playwright show-report playwright-report
```

## Production

```
docker compose up --build -d
```