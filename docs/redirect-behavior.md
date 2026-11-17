# Redirect behavior

How `redditRedirect.user.js` decides where to send the user. Moved from the Project section of CLAUDE.md; keep it in step with the script.

## On the new design (`www.reddit.com`)

The new design has no Hot home feed any more and has removed r/all, so:

- **Feeds** (`OLD_FEED`) go to the same address on `old.reddit.com`; the front page goes to `/hot`. Feeds are: the front page, `r/all`, `r/popular`, `r/friends`/`r/mod`/`r/random`, `r/a+b`, and custom feeds under `/user/` or `/u/`, each with an optional sort but nothing deeper, so posts under them aren't feeds.
- **A bare subreddit** (`/r/x`) goes to `/r/x/hot/` on the new design.
- **Everything else** stays on the new design.
- Reddit's server sends `www.reddit.com/r/a+b/` and `/r/all` to `/` before the script runs.

## When old Reddit turns the user away

If old Reddit bounces the user back to the same www page (or the front page) within 15 s without having shown a listing, then for a day:

- Feeds stay on www in the old design, and the front page goes to `/hot` there, using `redesign_optout` cookies scoped to feed paths.
- If that fails (`/hot` bounces straight back to `/`, or a feed shows no listing), feeds stay on the new design and the front page goes to the last custom feed they opened (`/user/<name>/m/<feed>/hot/`), or is left alone.

The script on old Reddit marks the bounce in a one-minute `.reddit.com` cookie, `rhr_old_seen`. Other state lives in www.reddit.com's localStorage (`rhr:*`).

## On old Reddit (`old.reddit.com`)

- Bare `/` (where the logo points; Best when logged in) goes to `/hot`.
- Clicked links to posts, subreddits and profiles open on the new design.
- The `redesign_optout` cookie is removed: old Reddit sets it for all of reddit.com, and it would put www in the old design.

## Build, tests and distribution

- No build step and no dependencies.
- Behavior tests in `test/redditRedirect.test.js` run the script against small hand-made fakes (Node's built-in runner): run plain `node --test` from the repo root (Node 22; CI runs the same on every push and PR).
- Installs and updates come from Greasy Fork (the `@updateURL`/`@downloadURL` in the header).
