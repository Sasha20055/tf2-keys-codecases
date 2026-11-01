# Sanitized production excerpts

These excerpts retain implementation structure from the original codebase. They are not wired to a deployment and deliberately omit all operational infrastructure.

Removed or replaced:

- live URLs and client identifiers;
- session/passport wiring and user records;
- database models and persistence implementation;
- external payment, trading, notification and analytics integrations;
- credentials, environment files and deployment files.

The `src/` directory contains dependency-free, tested companions that make the same individual ideas easier to run and inspect.

