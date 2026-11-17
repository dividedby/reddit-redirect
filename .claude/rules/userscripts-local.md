---
paths:
  - "**/*.user.js"
---

# Userscript: deliberate exceptions

The global rule `~/.claude/rules/userscripts.md` holds the engineering checklist; the shared copy is `docs/agents/userscript-guidelines.md`. This deviation from it is intentional here:

- `@run-at document-start`, so the redirect happens before Reddit renders.
