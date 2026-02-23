# Agent Instructions (Backend)

- Follow SOLID principles and keep clear separation of concerns.
- Keep the project minimal and runnable with TypeScript, with a single entrypoint and small modules.
- Use tsx for dev and tsc for build output to dist/.
- Prefer explicit, testable boundaries for config, domain logic, and I/O.
- config should be based on zod schema, on startup config must validate configurations from either .env or env vatiables agains the schema and fail on validation error logging the mission/incorrect variables. 
- maintain logs throughout the code
  - use console for loggins, use different log levels based on content and importance
  - log line should look as follows: `[filename/class name(if available)][function name] log message`
  - do not log large outputs. 