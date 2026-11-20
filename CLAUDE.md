# CLAUDE.md

## Project

A single userscript, `redditRedirect.user.js`, that opens Reddit in old Reddit with the front page on Hot, and makes the logo click go there too. Feeds go to `old.reddit.com`, a bare subreddit goes to its Hot page on the new design, everything else stays on the new design; fallbacks apply if old Reddit bounces the user back. Full rules: `docs/redirect-behavior.md`.

No build step and no dependencies. Installs and updates come from Greasy Fork (the `@updateURL`/`@downloadURL` in the header).

## Commands

- Test: `node --test` from the repo root (Node 22; behavior tests in `test/redditRedirect.test.js` run the script against hand-made fakes; CI runs the same on every push and PR).
- Format check: `pnpm format:check` (Prettier defaults; CI in `.github/workflows/format.yml`).
- Lint: `pnpm lint` (oxlint, default rules, warnings fail; CI `lint` job in `.github/workflows/test.yml`).

## Rules

- **Bump `@version` on every user-facing change**, or installed copies never update.
- Never rename the `.user.js` file or change `@namespace`, `@updateURL` or `@downloadURL`:
  installs and Greasy Fork are keyed on them.
- Public identity is `dividedby` only: no real name or personal email in code, headers, docs or
  commits. Commit as `dividedby <64715420+dividedby@users.noreply.github.com>`.

## Definition of done

Every **user-facing change** moves these together, in the same commit or PR:

- the script's `@version` (keep its `x.y` numbering);
- `CHANGELOG.md`: an entry under `## [Unreleased]`, rolled into a dated version section at
  release (style: `docs/agents/changelog-guideline.md`);
- `README.md` when what a user sees or does changes;
- `greasyfork-description.md`: the Greasy Fork listing text, with a **New in x.y** section.
  Greasy Fork only picks it up if the listing is set to sync from this repo (owner's Greasy Fork
  admin); otherwise the owner pastes it in.
- Test on reddit.com: loading `/` lands on `old.reddit.com/hot`, `/r/popular` on old Reddit, `/r/x`
  on `/r/x/hot/` in the new design, a post stays in the new design, and Back leaves Reddit; bare
  `old.reddit.com` lands on `/hot`; a post link on old Reddit (plain and Ctrl/Cmd-click) opens in
  the new design; in-app navigation is sent on too; Ctrl/Cmd-click on the logo opens a new tab. (Claude's
  browser tool can't open reddit.com; run `node --test`, which simulates these with a fake `location`, instead.)

Pushing to `main` is a release once Greasy Fork syncs from it: unfinished work goes on a branch.

## Where things live

| What                                                       | Where                                                                                                                        |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Redirect behavior (the old Project section)                | `docs/redirect-behavior.md`                                                                                                  |
| Userscript checklist; exception (`@run-at document-start`) | `~/.claude/rules/userscripts.md`; `.claude/rules/userscripts-local.md`; `docs/agents/userscript-guidelines.md` (shared copy) |
| Issue tracker, triage labels, changelog style, domain docs | `docs/agents/issue-tracker.md`, `triage-labels.md`, `changelog-guideline.md`, `domain.md`                                    |

Ideas: Idea Inbox is issue #16 (label `idea-inbox`); protocol in `docs/agents/idea-inbox.md`.
