# Feed restyle prototype

A prototype, not part of the released script: it makes old Reddit's feed pages (the front
page, `r/all`, `r/popular`, `r/a+b`, custom feeds; the pages the redirect keeps on old
Reddit) look and work like new Reddit's feed, on phones and desktop, light and dark.
Once the design is settled it moves into `redditRedirect.user.js`.

- `restyle.css`, `restyle.js`: the restyle. The script sets a phone-width viewport, adds an
  app bar (Home / Popular / All, sort pills, search, messages, avatar), a left rail on wide
  screens, and per post a header line, a full-width image for image posts and a row of pill
  buttons. It moves Reddit's own vote arrows, save and hide links rather than copying them,
  so their click handlers keep working.
- `bundle.mjs` writes `restyle.user.js`: both as one userscript (old.reddit.com feed pages
  only), to install in a userscript manager or inject with mobile-safari-lab.
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

Things to look at: vote, save, hide and the "⋯" menu still work (tap them); images keep
their aspect ratio; no sideways scrolling; the sticky bar doesn't cover the first post;
`safari console` shows no errors. The lab injects after the page has loaded, so a flash of
old Reddit before the restyle is expected there and says nothing about the real script.
