# Senior Engineer Code Review Checklist

Run through this checklist before presenting code or declaring any task complete:

## 1. Architectural Integrity
- [ ] Are controller, service, and repository layers strictly separated?
- [ ] Does the controller only handle HTTP input and output envelopes?
- [ ] Does the service contain all business invariants and zero Express dependencies?
- [ ] Does the repository encapsulate all database queries and Mongoose operations?
- [ ] Are subpath imports (`#shared/*`, `#modules/*`, `#config/*`) used everywhere?

## 2. Validation & Security
- [ ] Are all request params, queries, and bodies validated via Zod schemas?
- [ ] Are user passwords hashed with bcrypt using appropriate salt rounds (>= 10)?
- [ ] Are authentication (`authenticate`) and authorization (`authorize`) middlewares present on protected routes?
- [ ] Are sensitive fields excluded from API responses (e.g., `toSafeObject()` or `.select('-password')`)?
- [ ] Are database inputs safe against NoSQL query injection?
- [ ] Is rate limiting configured appropriately for sensitive endpoints?

## 3. Error Handling & Robustness
- [ ] Are errors thrown as typed `AppError` subclasses with clear, helpful error messages?
- [ ] Are all asynchronous controller routes wrapped in `asyncHandler(...)`?
- [ ] Are edge cases handled (e.g. not found, duplicate email/slug, empty list, invalid ID format)?
- [ ] Are errors logged with structured metadata using Pino logger?

## 4. Performance & Data Storage
- [ ] Are read queries using `.lean()` or indexed fields?
- [ ] Is pagination implemented for list endpoints (default page, limit, total count, total pages)?
- [ ] Are Redis cache keys deterministic and namespaced (e.g. `user:${id}`)?
- [ ] Is cache properly invalidated when records are created, updated, or deleted?
- [ ] Are multi-document database operations wrapped in Mongoose transactions where required?

## 5. Testing & Code Quality
- [ ] Are new or modified services covered by unit tests?
- [ ] Are HTTP routes covered by integration tests using Supertest?
- [ ] Do comments document intent and non-obvious behavior rather than restating types (no empty `@param req / @param res`)?
- [ ] Did `npm run typecheck` pass with 0 errors?
- [ ] Did `npm run lint` pass with 0 errors?
- [ ] Did `npm run test` pass with 100% passing tests?

