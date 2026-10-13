// ==UserScript==
// @name        Reddit Hot Redirect with Logo Click Handler
// @namespace   https://greasyfork.org/en/users/594496-divided-by
// @author      dividedby
// @description Opens Reddit's front page on Hot: old Reddit, or your custom feed if old Reddit turns you away. The logo goes there too
// @version     2.0
// @license     GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @homepageURL https://github.com/dividedby/reddit-redirect
// @supportURL  https://github.com/dividedby/reddit-redirect/issues
// @contributionURL     https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=dividedbygit@gmail.com&item_name=Reddit+Hot+Donation
// @contributionAmount  $1
// @match       https://www.reddit.com/*
// @run-at      document-start
// @grant       none
// @noframes
// @downloadURL https://update.greasyfork.org/scripts/508344/Reddit%20Hot%20Redirect%20with%20Logo%20Click%20Handler.user.js
// @updateURL   https://update.greasyfork.org/scripts/508344/Reddit%20Hot%20Redirect%20with%20Logo%20Click%20Handler.meta.js
// ==/UserScript==

// The new design has no Hot home feed any more (Best/New only), so the front page goes,
// in order of preference, to:
//   1. old Reddit's Hot (old.reddit.com/hot);
//   2. if old Reddit sent you back here, your custom feed sorted by Hot (the custom feed
//      you last opened on www.reddit.com);
//   3. with neither, Reddit's own front page, left alone.
// A turn-away from old Reddit is remembered for a day, then old Reddit is tried again.

(() => {
  'use strict';

  const OLD_HOT = 'https://old.reddit.com/hot';
  const KEY_TRIED = 'rhr:oldTried';     // when we last sent you to old Reddit (ms)
  const KEY_REFUSED = 'rhr:oldRefused'; // when old Reddit last sent you back (ms)
  const KEY_FEED = 'rhr:feed';          // custom feed path, e.g. /user/name/m/feed
  const BOUNCE_MS = 15e3;               // back on the front page this soon = sent back
  const RETRY_MS = 864e5;               // try old Reddit again after a day

  // The front page under any of its names; '/hot' and '/best' show Best on the new design.
  const FRONT = /^\/(hot|best)?\/?$/;
  const FEED = /^\/user\/[\w-]+\/m\/[\w-]+/;

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

  // Where the front page should go now: a URL, or null to leave it alone.
  const target = () => {
    if (Date.now() - time(KEY_REFUSED) > RETRY_MS) return OLD_HOT;
    const f = feed();
    return f ? f + '/hot/' : null;
  };

  const go = (how, url) => {
    if (url === OLD_HOT) write(KEY_TRIED, String(Date.now()));
    location[how](url);
  };

  const onPage = () => {
    const path = location.pathname;
    const f = path.match(FEED);
    if (f) write(KEY_FEED, f[0]);
    if (!FRONT.test(path)) return;
    // Sent to old Reddit moments ago and back on the front page: old Reddit turned us away.
    const now = Date.now();
    if (now - time(KEY_TRIED) < BOUNCE_MS && now - time(KEY_REFUSED) > RETRY_MS) {
      write(KEY_REFUSED, String(now));
    }
    const url = target();
    // replace() so Back skips the front page instead of landing on it and redirecting again
    if (url) go('replace', url + (url === OLD_HOT ? location.search : ''));
  };

  onPage();

  // Safari can load a page you're typing before you open it ("Preload Top Hit"); a redirect
  // made then can be lost, so check again once the page is shown.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') onPage();
  });

  // In-app navigation (pushState) isn't seen by popstate; the Navigation API reports every
  // same-document navigation. Targets never match FRONT, so there's no loop.
  if (window.navigation) {
    navigation.addEventListener('navigatesuccess', onPage);
  } else {
    window.addEventListener('popstate', onPage);
  }

  // Delegation catches the logo even after SPA re-renders, and needs no
  // document.body (null at document-start).
  document.addEventListener('click', e => {
    // Leave modified and non-left clicks (new tab/window) to the browser.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!e.target.closest('#reddit-logo')) return;
    const url = target();
    if (!url) return; // nothing better: Reddit's own front page
    e.preventDefault();
    go('assign', url);
  }, true);
})();
