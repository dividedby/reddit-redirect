# Changelog

All notable changes to the **Reddit Hot Redirect with Logo Click Handler** userscript
(`redditRedirect.user.js`, distributed via [Greasy Fork](https://greasyfork.org/scripts/508344))
are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/).

## [Unreleased]

## [2.2] - 2026-10-28

### Changed

- Only Reddit's feeds open in old Reddit now: the front page (on Hot), `r/all`, `r/popular`,
  combined subreddits (`r/a+b`), custom feeds, and old Reddit's `r/friends`, `r/mod` and
  `r/random`. Posts (also those reached through a feed), subreddits, profiles, search and
  every other page stay on Reddit's new design. Reddit's new design has removed `r/all`,
  sorts `r/popular` unreliably and still has no Hot front page, but it shows posts and
  subreddits fine.
- A subreddit opens sorted by Hot (`/r/<name>/hot/`): the new design starts every visit on
  Best and doesn't remember Hot.
- On old Reddit, links to posts, subreddits and profiles open in the new design (subreddits
  on Hot). This also applies to Ctrl/Cmd-click, middle-click and "Open in New Tab".
- If old Reddit turns you away, `r/all`, `r/popular` and custom feeds stay on the new design.

## [2.1] - 2026-10-13

### Added

- Every `www.reddit.com` page now opens at the same address on old Reddit, except pages
  only the new design has (settings, chat, notifications, the image viewer, mod tools,
  log-in pages, share links). If old Reddit turns you away, pages stay where they are.
- Bare `old.reddit.com`, where old Reddit's logo goes, now opens on Hot: old Reddit's
  front page shows Best when you're logged in.

## [2.0] - 2026-10-13

### Changed

- The front page (`/`, `/hot`, `/best`) and the logo now go to old Reddit's Hot
  (`old.reddit.com/hot`): Reddit's new design no longer has a Hot front page, so `/hot`
  showed Best.
- If old Reddit sends you back to the new design, they go to the custom feed you last
  opened, sorted by Hot, for a day; with no custom feed, the front page is left alone.
- In Safari, a front page preloaded while you type the address is redirected once it's shown.
- Internal: code brought to the shared style, and tests added.

## [1.6] - 2026-10-13

### Fixed

- The Back button no longer gets stuck: going back from Hot skips the front page instead of
  landing on it and being sent to Hot again.
- The redirect keeps anything after the `?` in the front-page address.
- Going to the front page from inside Reddit (without a full page load) now also sends you to
  Hot, in browsers that support the Navigation API (Chrome, Edge, recent Safari and Firefox).
- Ctrl/Cmd-click, Shift-click and Alt-click on the Reddit logo now do what your browser
  normally does (new tab or window) instead of being taken over.

### Changed

- The script no longer runs inside embedded frames and asks for no special userscript
  permissions.
