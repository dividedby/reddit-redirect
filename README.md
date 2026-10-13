# Reddit Hot Redirect with Logo Click Handler

A userscript for [reddit.com](https://www.reddit.com): Reddit opens in
[old Reddit](https://old.reddit.com), with the front page on **Hot** instead of Reddit's
default **Best**, and the Reddit logo takes you to Hot too.

Reddit's new design no longer has a Hot front page (only Best and New), and old Reddit's
front page shows Best when you're logged in. If old Reddit turns you away, you stay on
the new design and the front page falls back to your custom feed sorted by Hot.

**Install:** [Greasy Fork](https://greasyfork.org/en/scripts/508344) · [Changelog](CHANGELOG.md)

## How it works

- Every `www.reddit.com` page opens at the same address on `old.reddit.com`, before the
  page draws: posts, subreddits, profiles, search. Old Reddit needs you to be logged in.
- The front page (`reddit.com/`, `/hot`, `/best`, and bare `old.reddit.com`) goes to
  `old.reddit.com/hot`. Anything after the address (like `?feed=home`) is kept.
- A few pages only the new design has stay there: settings, chat, notifications, the
  image viewer, mod tools, log-in pages and share links (`/r/…/s/…`; once Reddit opens
  the post they point to, it's sent on to old Reddit).
- **If old Reddit sends you back** to the new design (Reddit is limiting it to people who
  have used it in the last six months), pages stay on the new design and the front page
  goes to your **custom feed** sorted by Hot: the custom feed you last opened. Old Reddit
  is tried again after a day. With no custom feed, the front page is left as Reddit shows it.
- Moving around inside the new design (the Home link, a post, the Back button) is sent on
  the same way.
- **Back still works:** the redirect replaces the page in your history instead of adding
  a step.
- A plain click on the Reddit logo goes to Hot. Ctrl/Cmd-click and middle-click are left
  to your browser (open in a new tab as usual).
- Nothing is sent anywhere: the remembered feed and the turn-away time stay in your
  browser's storage for reddit.com.

## Installing

1. Get a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Edge,
   Firefox, Safari), [Violentmonkey](https://violentmonkey.github.io/) (Firefox), or the
   [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) app (Safari on iPhone,
   iPad and Mac). In Chrome, also turn on **Allow user scripts** on Tampermonkey's details page.
2. Open the [Greasy Fork listing](https://greasyfork.org/en/scripts/508344) and click
   **Install this script**. Updates come from there. In the Userscripts app, allow it on
   both `www.reddit.com` and `old.reddit.com`.

## Development

The script is a single file, [`redditRedirect.user.js`](redditRedirect.user.js), with no
build step and no dependencies. Tests live in [`test/`](test/): run `node --test` from
the repo root (Node 22). It runs at `document-start` so the redirect happens before Reddit
renders. Bump `@version` with every change users would notice, and add it to the
[changelog](CHANGELOG.md) and [`greasyfork-description.md`](greasyfork-description.md).
Bugs and ideas go in the [issues](https://github.com/dividedby/reddit-redirect/issues).

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
