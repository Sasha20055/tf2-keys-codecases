# Engineering code cases

This repository contains selected, sanitized excerpts and small test harnesses from a marketplace-style application. It is intentionally **not** a runnable copy of the production application: it contains no credentials, customer data, payment-provider code, live domains, or deployment configuration.

## Production excerpts

The code in `production-excerpts/` preserves the structure and implementation approach of the original project. Only operational details were removed or replaced: live domains, persistence adapters, authentication setup, and provider-specific integrations.

- `frontend/useChat.js` — the original React hook structure for Socket.IO connection lifecycle, message history, presence and send cooldown.
- `backend/chatSocketCore.js` — the original room/presence and token-bucket flow, extracted from the Socket.IO server so its persistence boundary can be supplied by an application.
- `backend/roulette.js` — the original weighted-prize algorithm, including the production weights and `crypto.randomInt` selection.

## Included cases

| Case | What it demonstrates |
| --- | --- |
| `daily-reward` | Weighted prize selection with an injected random source, UTC daily eligibility, and deterministic tests. |
| `realtime` | Framework-agnostic chat-session state: room joining, message de-duplication, presence updates, cooldown, and cleanup. |
| `reporting` | A declarative builder for a MongoDB aggregation pipeline that produces order metrics by status and currency. |
| `security` | Explicit, testable configuration for common Express security middleware. |

## Run checks

Requires Node.js 20 or newer. There are no runtime dependencies.

```bash
npm test
npm run check
```

## Design notes

The examples prefer dependency injection at boundaries:

- `spinDailyReward` receives a clock and an RNG;
- `createChatSession` receives a socket factory and clock;
- reporting returns a data-only MongoDB pipeline instead of opening a database connection;
- security helpers return configuration objects instead of reading process-wide environment variables.

That keeps domain logic deterministic, easy to test, and independent of live services.

More details: [architecture notes](docs/architecture.md).

