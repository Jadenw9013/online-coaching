## 2026-03-13 - Insecure Random Number Generation for Coach Codes
**Vulnerability:** Usage of `Math.random()` for generating coach codes, which is not cryptographically secure and can be predictable.
**Learning:** `Math.random()` should never be used for security-sensitive operations like generating unique identifiers or access codes.
**Prevention:** Always use `node:crypto` module's `randomInt` or `randomBytes` for generating secure random values in Node.js environments.
