# Feed restyle prototype

A prototype, not part of the released script: it makes old Reddit's feed pages (the front
page, `r/all`, `r/popular`, `r/a+b`, custom feeds; the pages the redirect keeps on old
Reddit) look and work like new Reddit's feed, on phones and desktop, light and dark. That
includes www when old Reddit has turned you away and the redirect keeps feeds there in the old
design: the script runs on www only on a feed path where the `redesign_optout` cookie is
visible, and backs out if the page has no `#header` (the new design).
Once the design is settled it moves into `redditRedirect.user.js`.

- `restyle.css`, `restyle.js`: the restyle. The script sets a phone-width viewport, adds an
  app bar (Home / Popular / All, sort pills, search, messages, avatar), a left rail on wide
  screens, and per post a header line, a full-width image for image posts and a row of pill
  buttons. It moves Reddit's own vote arrows, save and hide links rather than copying them,
  so their click handlers keep working.
- `bundle.mjs` writes `restyle.user.js`: both as one userscript (feed pages only), to install in a userscript manager or inject with mobile-safari-lab.
- `fetch-less.mjs`, `build.mjs`, `shoot.mjs`: the mockup harness. `fetch-less.mjs <dir>`
  fetches old Reddit's stylesheet source from
  [reddit-archive](https://github.com/reddit-archive/reddit) (compile it with `lessc
  reddit.less reddit.css` into `vendor/`), `build.mjs` writes `fixture.html`, an old Reddit
  front page with placeholder images, and `shoot.mjs <Old Reddit Mobile Layout.user.js>`
  screenshots it plain, with that script and with the restyle (Playwright's Chromium).

## Checking it in real Mobile Safari (mobile-safari-lab, on the Mac)

Old Reddit needs you to be logged in, and the lab's clean simulator is logged out. Use the
iPhone (signed in to Reddit in Safari), or the configured simulator after signing in to
Reddit in it by hand (`sim create --profile configured` once, then `lab up --profile
configured`). Never type a password through the lab.

```sh
sim run reddit-restyle
lab up --profile configured --url https://old.reddit.com/hot     # or --target device
safari inject prototype/restyle/restyle.user.js
safari wait --settled && safari shot --page
sim appearance dark        # simulator; on the iPhone: safari appearance dark
safari shot --page
safari open https://old.reddit.com/r/popular/ --reinject && safari shot --page
lab down
```

Things to look at: vote, save, hide and the "⋯" menu still work (tap them); Share opens with the post's link; Report and Crosspost fit the screen; images keep
their aspect ratio; no sideways scrolling; the sticky bar doesn't cover the first post;
`safari console` shows no errors. The lab injects after the page has loaded, so a flash of
old Reddit before the restyle is expected there and says nothing about the real script.

Voting changes the post on Reddit even when the page doesn't show it, so check the result with
Reddit (`/by_id/t3_<id>.json`: `likes`, `saved`, `hidden`) and undo what you tapped. To compare
with another userscript in the same session, inject each by hand after `safari open`:
`--reinject` re-runs every script injected so far. On the iPhone the owner's Safari extensions
run in the page too: Noir repaints the restyle's colors in dark mode, even with the restyle
installed at document-start (turn it off for Reddit to see the real ones), and Sink It sets post
padding with `!important`. Dark Reader in Chrome honors the `darkreader-lock` meta the restyle
adds, so it leaves the restyle's colors alone.

To test the real thing, install `restyle.user.js` in the Userscripts app, which does run in the
lab's tab (it's the file in the iCloud Drive `Userscripts` folder). New code reaches the phone in
seconds, but a changed `@match` doesn't: the app kept the old list until its Safari menu and the app
itself were opened. Then the flash can be checked too, with `first-contentful-paint` (WebKit has no
`first-paint` entry) against `domContentLoadedEventStart`. Both this build and the one before it paint
about 7 ms before or 35 ms after it, so that gap alone doesn't show a flash; on www `/r/popular/`
measured about 60 ms before. Only watching the screen settles it.

### Feeds on www after a turn-away

To see them on a phone old Reddit lets in, note the `rhr:*` values in www's localStorage, set
`rhr:oldRefused` to `Date.now()` from a page that stays on www (`/r/test/hot/`), and open a feed there
(the lab needs `--allow-host` for www.reddit.com and old.reddit.com). Afterwards put the `rhr:*` values
back and remove the `redesign_optout` cookie from each path in `FEED_PATHS`, as well as any other feed
you opened. `/by_id/*.json` doesn't return JSON on www, so check votes and saves on old.reddit.com.

### Desktop

Claude's browser tools, Claude in Chrome included, refuse reddit.com, and a Mac that isn't signed in
gets old Reddit's login page. To check layout in real Chrome, save a feed's HTML from the signed-in
phone with its scripts, inline handlers and `uh` input removed, serve it on 127.0.0.1 with `restyle.css`
and `restyle.js` added at the top of `<head>`, and size an iframe to test the breakpoints (1100 px for
the rail). Reddit's own scripts don't run there, so vote, save and Share need the real site. Delete the
copy afterwards: it holds your subscriptions and username.
