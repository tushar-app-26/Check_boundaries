# Shop — Real Module Boundaries

A small four-module shop application built with TypeScript and Node.js. This project demonstrates how to enforce module boundaries while preserving existing application behaviour.

## Modules

- **Orders** — places orders and coordinates inventory and payment operations.
- **Inventory** — manages stock availability and reservations.
- **Payments** — handles payment operations.
- **Notifications** — handles order confirmation messages by subscribing to domain events.

Shared infrastructure lives under `src/platform`.

## Requirements

- Node.js 22.18 or later
- TypeScript files run directly using Node.js; no build step is required.
- Type-checking is optional and requires TypeScript and Node.js type definitions.

Optional type-checking setup:

```bash
npm install -D typescript @types/node
npx tsc --noEmit
```

## Run the application

From the project root:

```bash
node src/app.ts
```

## Run tests

Run the complete test suite:

```bash
node --test
```

Check module boundaries:

```bash
node tools/check-boundaries.ts
```

The boundary checker reports violations when a module imports another module's private implementation instead of its public API.

## Module boundary rules

A module may import:

1. Its own internal files.
2. Shared infrastructure from `src/platform`.
3. Another module through that module's `index.ts` public API.

A module must not import another module's private service or repository files. Type-only imports across module boundaries are also subject to these rules.

## Event-driven notifications

Orders publishes an `order.placed` event after successfully placing an order. Notifications subscribes to that event and sends the confirmation.

The event bus:

- Supports multiple subscribers.
- Continues processing when a handler throws.
- Returns the number of handlers reached by `publish()`.
- Supports unsubscribe callbacks.
- Allows the same handler to be subscribed more than once.

Orders does not directly import or call the notifications module.

## Extraction plan

See [`EXTRACTION-PLAN.md`](./EXTRACTION-PLAN.md) for the proposed notifications extraction, data ownership, network timeout risks, migration steps, and stop criteria.

## Behaviour preservation

The existing flow tests must continue to pass. The objective is to improve module boundaries and event handling without changing observable shop behaviour.