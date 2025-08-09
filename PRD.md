# Product Requirements Document (PRD)

## Project: Theatre App Backend Migration to Fastify + TypeScript

### 1. Overview

This document outlines the requirements and migration plan for upgrading the theatre-app backend from Express.js to Fastify, using TypeScript for type safety and maintainability. The goal is to modernize the backend, improve performance, and ensure long-term support.

---

### 2. Functionalities

- User authentication and authorization
- Movie management (CRUD)
- Hall management (CRUD)
- Show scheduling (CRUD)
- Booking management (CRUD)
- Database initialization and configuration
- Middleware for authorization and other cross-cutting concerns

---

### 3. Current Tech Stack

- Node.js (TypeScript)
- Express.js
- SQL database (PostgreSQL/MySQL)
- Docker & Docker Compose
- Custom validation and middleware

---

### 4. Target Tech Stack

- Node.js (TypeScript)
- Fastify (latest version)
- Fastify plugins for validation, CORS, security, etc.
- SQL database (PostgreSQL/MySQL)
- Docker & Docker Compose
- TypeBox or Zod for schema validation
- Modern error handling and logging

---

### 5. Migration Plan

#### 5.1 Preparation

- Review and document all current routes, middleware, and business logic.
- Ensure all code is committed and backed up.

#### 5.2 Install Fastify and Types

- `npm install fastify`
- `npm install --save-dev @types/node @fastify/type-provider-typebox`

#### 5.3 Update Project Structure

- Organize code into `src/` with clear separation for routes, plugins, models, config, and db.

#### 5.4 Refactor Entry Point

- Replace Express app with Fastify instance in `server.ts`.
- Register all routes as Fastify plugins.
- Use Fastify’s built-in logger.

#### 5.5 Refactor Routes

- Convert each route file to export a Fastify plugin.
- Use Fastify’s schema validation for request/response.

#### 5.6 Refactor Middleware

- Convert Express middleware to Fastify plugins or hooks.
- Use Fastify’s `onRequest` or `preHandler` hooks for authorization.

#### 5.7 Update Validation

- Use Fastify’s schema validation for all endpoints.
- Migrate validation logic from `validations.ts` to Fastify route schemas.

#### 5.8 Update Error Handling

- Use Fastify’s error handling hooks (`setErrorHandler`).
- Remove Express-specific error middleware.

#### 5.9 Update Database Integration

- Ensure DB connection is initialized before server starts.
- No change needed if using raw SQL or TypeORM/Prisma.

#### 5.10 Update Docker and Scripts

- Update Dockerfile if needed to use `npm run build` and `node dist/server.js`.
- Update `docker-compose.yml` if any service names or ports change.

#### 5.11 Update TypeScript Config

- Ensure `tsconfig.json` targets ES2020 or later.
- Set `moduleResolution` to `node` and `esModuleInterop` to `true`.

#### 5.12 Testing

- Test all endpoints with Postman or integration tests.
- Fix any issues with request/response formats or error handling.

#### 5.13 Documentation

- Update README with new setup, run, and API usage instructions.
- Leverage Fastify’s OpenAPI/Swagger plugin for auto-generated docs.

#### 5.14 Optional Enhancements

- Add CORS, helmet, and rate limiting via Fastify plugins.
- Add environment variable management with `dotenv`.
- Add unit/integration tests with Jest or Vitest.

---

### 6. Deliverables

- Fully refactored backend using Fastify and TypeScript
- Updated Docker and deployment scripts
- Comprehensive documentation and API docs
- Test coverage for all endpoints

---

### 7. Timeline

- Week 1: Preparation, install dependencies, update structure
- Week 2: Refactor entry point, routes, and middleware
- Week 3: Validation, error handling, and database integration
- Week 4: Testing, documentation, and enhancements

---

### 8. Success Criteria

- All existing functionalities are preserved
- All endpoints pass integration tests
- Performance and maintainability are improved
- Documentation is up to date

---

_Last updated: 2025-08-09_
