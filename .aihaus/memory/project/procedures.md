# Procedures

## Development closeout

1. Run affected checks.
2. Run broader repository checks required by the Definition of Done.
3. Record commands, exit codes, and degraded checks.
4. Review the diff and update durable memory only when warranted.

## Operational procedures

- **Git Versioning & Synchronization:**
  - `git commit -am "<mensagem>"`
  - `git push origin main`
- **Aihaus Memory Discovery:**
  - `node .aihaus/tools/refresh.mjs --repo . --json`
  - `node .aihaus/tools/refresh.mjs --repo . --status --json`
