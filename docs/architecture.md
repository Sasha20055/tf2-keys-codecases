# Architecture notes

## Daily reward

`spinDailyReward` only decides whether a spin is allowed and which prize is selected. Persistence belongs to an application service or repository. Its `now` and `randomInt` dependencies are supplied by the caller, so tests do not need to mock global time or cryptography.

## Realtime session

The session is an adapter between a socket-like transport and a UI. It never creates global sockets, owns one unsubscribe function for every listener, and deduplicates messages by stable ID. A React hook, Vue composable, or plain browser component can subscribe to the same small interface.

## Reporting

The report builder keeps metric definitions in data. The generated pipeline can be passed directly to `Order.aggregate(pipeline)`. Adding a payment method or currency changes a metric definition rather than duplicating a large `$cond` block.

## Security

Security policy is configuration, not a hidden side effect. The example keeps approved client origins and CSP connection sources in one place; an Express composition root can provide them to `cors`, `helmet`, `express-rate-limit`, sessions, and CSRF middleware.

