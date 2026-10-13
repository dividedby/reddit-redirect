# Changelog

All notable changes to the **Reddit Hot Redirect with Logo Click Handler** userscript
(`redditRedirect.user.js`, distributed via [Greasy Fork](https://greasyfork.org/scripts/508344))
are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/).

## [Unreleased]

### Changed

- Internal: code brought to the shared style, and tests added. No behavior change.

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
