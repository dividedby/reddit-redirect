// ==UserScript==
// @name        Reddit Hot Redirect with Logo Click Handler
// @namespace   https://greasyfork.org/en/users/594496-divided-by
// @author      dividedby
// @description Opens Reddit in old Reddit, with the front page on Hot (or your custom feed if old Reddit turns you away). The logo goes there too
// @version     2.1
// @license     GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @homepageURL https://github.com/dividedby/reddit-redirect
// @supportURL  https://github.com/dividedby/reddit-redirect/issues
// @contributionURL     https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=dividedbygit@gmail.com&item_name=Reddit+Hot+Donation
// @contributionAmount  $1
// @match       https://www.reddit.com/*
// @match       https://old.reddit.com/*
// @run-at      document-start
// @grant       none
// @noframes
// @downloadURL https://update.greasyfork.org/scripts/508344/Reddit%20Hot%20Redirect%20with%20Logo%20Click%20Handler.user.js
// @updateURL   https://update.greasyfork.org/scripts/508344/Reddit%20Hot%20Redirect%20with%20Logo%20Click%20Handler.meta.js
// ==/UserScript==

// Reddit pages open in old Reddit, and the front page on Hot. The new design has no Hot
// front page any more (Best/New only), and old Reddit's front page shows Best when you're
// logged in. In order of preference:
//   1. old Reddit: every page except the few only the new design has (NEW_ONLY), with the
//      front page on Hot (old.reddit.com/hot);
//   2. if old Reddit sent you back here, pages stay on the new design and the front page
//      goes to your custom feed sorted by Hot (the custom feed you last opened here);
//   3. with neither, Reddit's own front page, left alone.
// A turn-away from old Reddit is remembered for a day, then old Reddit is tried again.

(() => {
  'use strict';

  const OLD = 'https://old.reddit.com';

  // On old Reddit, only the bare front page (where the logo points) is sent to Hot.
  if (location.hostname === 'old.reddit.com') {
    const toHot = () => {
      if (location.pathname === '/') location.replace('/hot' + location.search + location.hash);
    };
    toHot();
    // Safari can load a page you're typing before you open it ("Preload Top Hit"); a
    // redirect made then can be lost, so check again once the page is shown.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') toHot();
    });
    return;
  }

  const KEY_TRIED = 'rhr:oldTried';     // when we last sent you to old Reddit (ms)
  const KEY_TRIED_PATH = 'rhr:oldPath'; // and from which page
  const KEY_REFUSED = 'rhr:oldRefused'; // when old Reddit last sent you back (ms)
  const KEY_FEED = 'rhr:feed';          // custom feed path, e.g. /user/name/m/feed
  const BOUNCE_MS = 15e3;               // back here this soon = sent back
  const RETRY_MS = 864e5;               // try old Reddit again after a day

  // The front page under any of its names; '/hot' and '/best' show Best on the new design.
  const FRONT = /^\/(hot|best)?\/?$/;
  const FEED = /^\/user\/[\w-]+\/m\/[\w-]+/;
  // Pages only the new design has, and share links (/r/x/s/abc), which only the new design
  // resolves (it then redirects to the post itself, which is sent on to old Reddit).
  const NEW_ONLY = /^\/(settings|media|chat|login|register|password|account|notifications|mod|answers|explore|t|topics|premium|coins|appeals|poll|report|avatar|achievements)(\/|$)|^\/(r|u|user)\/[^/]+\/s\//;

  // Storage can throw (blocked site data, some private modes); without it the script still
  // redirects, it just can't notice a turn-away or remember a feed.
  const read = key => {
    try { return localStorage.getItem(key); } catch { return null; } // intended: see above
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* intended: see above */ }
  };
  const time = key => {
    const n = Number(read(key));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const feed = () => {
    const f = read(KEY_FEED);
    return typeof f === 'string' && FEED.test(f) ? f.match(FEED)[0] : null;
  };
  const refused = () => Date.now() - time(KEY_REFUSED) <= RETRY_MS;

  // Where a page should go: a URL, or null to stay. `rest` is the query and hash.
  const target = (path, rest = '') => {
    if (!refused()) {
      if (FRONT.test(path)) return OLD + '/hot' + rest;
      return NEW_ONLY.test(path) ? null : OLD + path + rest;
    }
    if (!FRONT.test(path)) return null;
    const f = feed();
    return f ? f + '/hot/' : null;
  };

  const go = (how, url, path) => {
    if (url.startsWith(OLD)) {
      write(KEY_TRIED, String(Date.now()));
      write(KEY_TRIED_PATH, path);
    }
    location[how](url);
  };

  // `loaded`: a fresh page load, the only time old Reddit can have just sent you back.
  const onPage = loaded => {
    const path = location.pathname;
    const f = path.match(FEED);
    if (f) write(KEY_FEED, f[0]);
    const now = Date.now();
    if (loaded === true && !refused() && now - time(KEY_TRIED) < BOUNCE_MS
      && (path === read(KEY_TRIED_PATH) || FRONT.test(path))) {
      write(KEY_REFUSED, String(now)); // sent to old Reddit moments ago and back: turned away
    }
    const url = target(path, location.search + location.hash);
    // replace() so Back skips this page instead of landing on it and redirecting again
    if (url) go('replace', url, path);
  };

  onPage(true);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') onPage(); // Safari preload: see above
  });

  // In-app navigation (pushState) isn't seen by popstate; the Navigation API reports every
  // same-document navigation. Targets are on old Reddit or a feed, so there's no loop.
  if (window.navigation) {
    navigation.addEventListener('navigatesuccess', () => onPage());
  } else {
    window.addEventListener('popstate', () => onPage());
  }

  // Delegation catches the logo even after SPA re-renders, and needs no
  // document.body (null at document-start).
  document.addEventListener('click', e => {
    // Leave modified and non-left clicks (new tab/window) to the browser.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!e.target.closest('#reddit-logo')) return;
    const url = target('/');
    if (!url) return; // nothing better: Reddit's own front page
    e.preventDefault();
    go('assign', url, '/');
  }, true);
})();
