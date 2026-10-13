# Reddit Hot Redirect with Logo Click Handler

A userscript for [reddit.com](https://www.reddit.com): the front page opens on **Hot**
instead of Reddit's default **Best**, and the Reddit logo takes you to Hot too.

Reddit's new design no longer has a Hot front page (only Best and New), so the script
sends you to [old Reddit](https://old.reddit.com/hot), which still has one. If old Reddit
turns you away, it falls back to your custom feed sorted by Hot.

**Install:** [Greasy Fork](https://greasyfork.org/en/scripts/508344) · [Changelog](CHANGELOG.md)

## How it works

- Opening `reddit.com/` (or `/hot`, `/best`) takes you straight to `old.reddit.com/hot`,
  before the page draws. Anything after the address (like `?feed=home`) is kept. Old
  Reddit needs you to be logged in.
- **If old Reddit sends you back** to the new design (Reddit is limiting it to people who
  have used it in the last six months), the front page goes to your **custom feed**
  sorted by Hot instead: the custom feed you last opened on `www.reddit.com`. Open the one
  you want once and it's remembered. Old Reddit is tried again after a day.
- With neither, the front page is left as Reddit shows it.
- Moving to the front page from inside Reddit (the Home link, the Back button) lands on
  Hot as well.
- **Back still works:** the redirect replaces the front page in your history instead of
  adding a step, so Back takes you to where you were before Reddit.
- A plain click on the Reddit logo goes to the same place. On old Reddit, the logo goes
  to Hot too (a subreddit's own header logo still goes to that subreddit). Ctrl/Cmd-click and middle-click are left
  to your browser (open in a new tab as usual).
- Only the front page itself is redirected; every other page (subreddits, posts, your
  custom feeds) is left alone. Nothing is sent anywhere: the remembered feed and the
  turn-away time stay in your browser's storage for reddit.com.

## Installing

1. Get a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Edge,
   Firefox, Safari), [Violentmonkey](https://violentmonkey.github.io/) (Firefox), or the
   [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) app (Safari on iPhone,
   iPad and Mac). In Chrome, also turn on **Allow user scripts** on Tampermonkey's details page.
2. Open the [Greasy Fork listing](https://greasyfork.org/en/scripts/508344) and click
   **Install this script**. Updates come from there.

## Development

The script is a single file, [`redditRedirect.user.js`](redditRedirect.user.js), with no
build step and no dependencies. Tests live in [`test/`](test/): run `node --test` from
the repo root (Node 22). It runs at `document-start` so the redirect happens before Reddit
renders. Bump `@version` with every change users would notice, and add it to the
[changelog](CHANGELOG.md) and [`greasyfork-description.md`](greasyfork-description.md).
Bugs and ideas go in the [issues](https://github.com/dividedby/reddit-redirect/issues).

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
