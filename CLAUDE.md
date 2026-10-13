# CLAUDE.md

## Project

A single userscript, `redditRedirect.user.js`, that sends Reddit's default front page ("best") to `/hot` and makes the logo click go there too. No build step, no tests. Installs and updates come from Greasy Fork (the `@updateURL`/`@downloadURL` in the header).

## Rules

- **Bump `@version` on every user-facing change**, or installed copies never update.
- Never rename the `.user.js` file or change `@namespace`, `@updateURL` or `@downloadURL`:
  installs and Greasy Fork are keyed on them.
- Public identity is `dividedby` only: no real name or personal email in code, headers, docs or
  commits. Commit as `dividedby <64715420+dividedby@users.noreply.github.com>`.

## Userscript engineering

Before changing a `.user.js`, read [`docs/agents/userscript-guidelines.md`](docs/agents/userscript-guidelines.md),
the full checklist (shared by all the dividedby userscript repos). The rules that matter most:

- **Smallest reliable change.** Preserve existing behavior, fix the problem at hand without
  unrelated rewrites, and add no dependency, build step or abstraction without a reason.
- **Metadata.** Narrow `@match`; only the `@grant`s actually used (`@grant none` stated
  explicitly); no wildcard `@connect`; `@run-at` chosen by need. Never change `@namespace` or
  the update URLs.
- **Untrusted input** (page text, network responses, anything read back from storage) never
  goes into `innerHTML`: build DOM with `textContent`. No `eval`, `new Function` or remote code.
- **Validate stored values** (type and shape) before using them; keep storage keys namespaced.
- **Safe to run twice** (a second install, re-initialization): no duplicate UI, listeners,
  styles or observers.
- **Observers and timers.** Observe the smallest stable root with filters, ignore the script's
  own mutations, never poll without a bound, and read layout before writing it.
- **Network and errors.** Time out, check status and response shape, ignore stale results; no
  silent `catch {}` for unexpected errors (log with the script's prefix; leave a comment where
  swallowing is intended, e.g. storage in private mode).
- **Navigation.** `popstate` doesn't see `pushState`; redirects use `location.replace` so Back
  still works; a patched page API keeps its arguments, `this` and return value.
- **Validation.** Node/jsdom tests don't prove the script works in a manager: check it on the
  real site and say exactly what was and wasn't tested.

Deliberate exception here: `@run-at document-start`, so the redirect happens before Reddit renders.

## Agent skills

### Issue tracker
GitHub issues in `dividedby/reddit-redirect` (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels
State: `needs-triage`, `ready-for-agent`, `ready-for-human`, `blocked`, `wontfix`. Category: `bug`, `enhancement`, `chore`, `epic`. Size: `size:S/M/L/XL`. See `docs/agents/triage-labels.md`.

### Domain docs
Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

## Intake convention

When I say **"file an issue"** — or hand you a **plainly-scoped bug** — file a
`needs-triage` issue directly via `gh`.
