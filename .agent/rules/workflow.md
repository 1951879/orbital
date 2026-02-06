---
description: Workflow rules for the Orbital project
---

# Workflow Rules

## Development Server
- **STATUS:** ALWAYS RUNNING.
- **ACTION:** DO NOT run `npm run dev`.
- **CHECK:** If you need to verify the app, check `http://localhost:5173/` (or 5174/5175) first. Only start the server if `curl` or `fetch` fails.
