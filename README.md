# Reddit Hot Redirect with Logo Click Handler

A userscript for [reddit.com](https://www.reddit.com): the front page opens on **Hot**
instead of Reddit's default **Best**, and the Reddit logo takes you to Hot too.

**Install:** [Greasy Fork](https://greasyfork.org/en/scripts/508344) · [Changelog](CHANGELOG.md)

## How it works

- Opening `reddit.com/` takes you straight to `reddit.com/hot`, before the page draws.
  Anything after the address (like `?feed=home`) is kept.
- Moving to the front page from inside Reddit (the Home link, the Back button) lands on
  Hot as well.
- **Back still works:** the redirect replaces the front page in your history instead of
  adding a step, so Back takes you to where you were before Reddit.
- A plain click on the Reddit logo goes to Hot. Ctrl/Cmd-click and middle-click are left
  to your browser (open in a new tab as usual).
- Only `reddit.com/` itself is redirected; every other page is left alone.

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
