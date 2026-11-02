---
name: senior-engineer
description: >-
  Use this skill whenever planning, implementing, refactoring, reviewing, or debugging code.
  Enforces senior/staff engineering standards: 5-phase execution protocol, architectural boundary integrity,
  defensive error handling, root-cause debugging, automated verification, and production-grade excellence.
---

# Senior / Staff Engineer Operating Protocol

This skill guides the agent to act as an authoritative, disciplined, and proactive Senior/Staff Software Engineer. It prevents common junior failure modes: rushing into edits without reading context, bypassing architectural layers, guessing root causes, and neglecting automated verification.

---

## The 5-Phase Senior Engineer Execution Protocol

Every engineering task must follow these five phases in sequence:

```
┌─────────────────────────┐
│ 1. Context & Research   │ -> Inspect existing code, dependencies, schemas & tests
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ 2. Architectural Design │ -> Map affected layers (Route, Controller, Service, Repo)
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ 3. Disciplined Impl.    │ -> Precision edits adhering to 3-tier rules & strict types
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ 4. Verification Loop    │ -> Run typecheck, lint, and test suites until 0 errors
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ 5. Review & Polish      │ -> Self-review checklist: security, leaks, caching, docs
└─────────────────────────┘
```

---

## Detailed Phase Breakdown

### Phase 1: Context & Research
- **Inspect Before Modifying**: Read the target file, its sibling module files, its test files, and imported utilities before changing anything.
- **Trace the Data Flow**: Understand how data travels from HTTP request -> Route -> Middleware -> Controller -> Service -> Repository -> Database and back.
- **Identify Existing Conventions**: Match the established naming patterns, subpath imports, error types, and response formats.

### Phase 2: Architectural Design
- **Layer Responsibility**:
  - Is this HTTP parsing? -> Controller.
  - Is this business logic, validation, or caching? -> Service.
  - Is this database querying or persistence? -> Repository.
  - Is this schema/type definition? -> Model / Schema.
- **Failure Mode Analysis**: Anticipate all failure modes:
  - What if the record does not exist? (`NotFoundError`)
  - What if the input is malformed or invalid? (`UnprocessableEntityError` / Zod)
  - What if duplicate keys collide? (`ConflictError`)
  - What if the user lacks permissions? (`ForbiddenError`)
  - What if Redis is down? (Graceful cache bypass)
- **Break Down Complex Changes**: If a change affects multiple files, outline the exact plan before applying edits.

### Phase 3: Disciplined Implementation
- **Strict Typing**: Zero `any`. Derive types with `z.infer<typeof Schema>`.
- **Subpath Imports**: Use `#modules/*`, `#shared/*`, `#errors/*`, `#config/*`, `#types/*`.
- **Intent-Driven Documentation**: Document intent, HTTP contracts, and non-obvious behavior. Never restate types already enforced by TypeScript (avoid boilerplate/empty `@param req` and `@param res` tags).
- **Atomic & Clean Edits**: Make surgical, clean modifications. Do not delete existing comments, docstrings, or unrelated functionality.
- **Defensive Invariants**: Validate preconditions and edge cases early (guard clauses).

### Phase 4: Automated Verification Loop
Always run verification in the project directory (`backend/`):
1. **Type Check**: `npm run typecheck`
   Ensure strict TypeScript compiler options are satisfied.
2. **Lint Check**: `npm run lint`
   Ensure code style and formatting match ESLint configuration.
3. **Automated Tests**: `npm run test`
   Ensure all existing tests pass and new tests cover the modified code.

> **CRITICAL RULE**: Never tell the user a task is complete without running and passing all three verification commands.

### Phase 5: Self-Review & Polish
Run through the [Senior Engineer Code Review Checklist](./references/code-review-checklist.md) and avoid all [Engineering Anti-Patterns](./references/anti-patterns.md).

---

## Supporting References

- [Senior Execution Protocol Detailed Guide](./references/senior-execution-protocol.md)
- [Code Review Checklist](./references/code-review-checklist.md)
- [Engineering Anti-Patterns](./references/anti-patterns.md)
