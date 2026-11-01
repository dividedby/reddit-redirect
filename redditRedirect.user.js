// ==UserScript==
// @name        Reddit Hot Redirect with Logo Click Handler
// @namespace   https://greasyfork.org/en/users/594496-divided-by
// @author      dividedby
// @description Opens Reddit's feeds in old Reddit, with the front page on Hot (or your custom feed if old Reddit turns you away), and subreddits on Hot. The logo goes there too
// @version     2.2
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

// Reddit's feeds open in old Reddit, posts and subreddits in the new design. The new design
// has no Hot front page any more (Best only), has dropped r/all, sorts r/popular unreliably,
// and doesn't remember a subreddit's sort; old Reddit's front page shows Best when you're
// logged in. So:
//   - the front page goes to old Reddit's Hot (old.reddit.com/hot), and r/all, r/popular,
//     combined subreddits (r/a+b), custom feeds and r/friends, r/mod and r/random open on
//     old Reddit (OLD_FEED);
//   - a subreddit opens on the new design sorted by Hot (/r/x/hot/), and on old Reddit,
//     links to posts, subreddits and profiles open on the new design;
//   - if old Reddit sent you back here, feeds stay on the new design and the front page
//     goes to your custom feed sorted by Hot (the custom feed you last opened here), or,
//     with none, is left alone.
// A turn-away from old Reddit is remembered for a day, then old Reddit is tried again.

(() => {
  'use strict';

  const OLD = 'https://old.reddit.com';
  const NEW = 'https://www.reddit.com';

  // Feeds kept on old Reddit: the front page, r/all (with r/all-x filters), r/popular, old
  // Reddit's r/friends, r/mod and r/random, combined subreddits and custom feeds, each with an
  // optional sort. A post or any other page under one of them is not a feed.
  const OLD_FEED = /^\/((hot|new|rising|top|controversial|best)\/?)?$|^\/(r\/(all(-\w+)*|popular|friends|mod|random|randnsfw|\w+(\+\w+)+)|u(ser)?\/[\w-]+\/m\/[\w-]+)(\/(hot|new|rising|top|controversial|best|gilded))?\/?$/i;
  // A subreddit with no sort chosen, which the new design shows as Best.
  const isSub = path => /^\/r\/\w+\/?$/i.test(path) && !OLD_FEED.test(path);
  const hot = path => path.replace(/\/?$/, '/hot/');

  // Gives a clicked link its new address just before the browser (or Reddit's own router)
  // follows it, so Ctrl/Cmd-click, middle-click and "Open in New Tab" get it too.
  // `to(path)` returns the new address without the query and hash, or null to leave it.
  const retargetLinks = to => {
    const retarget = e => {
      const a = e.composedPath().find(n => n.localName === 'a' && n.href);
      if (!a || a.hostname !== location.hostname) return;
      const url = to(a.pathname);
      if (url) a.href = url + a.search + a.hash;
    };
    for (const type of ['click', 'auxclick', 'contextmenu']) {
      document.addEventListener(type, retarget, true);
    }
  };

  // On old Reddit, the bare front page (where the logo points) is sent to Hot, and links to
  // anything but a feed open on the new design.
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
    retargetLinks(path => (/^\/(r|u|user)\//i.test(path) && !OLD_FEED.test(path)
      ? NEW + (isSub(path) ? hot(path) : path) : null));
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
    if (isSub(path)) return hot(path) + rest;
    if (!refused()) {
      if (FRONT.test(path)) return OLD + '/hot' + rest;
      return OLD_FEED.test(path) ? OLD + path + rest : null;
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
  // same-document navigation. No target is redirected again, so there's no loop.
  if (window.navigation) {
    navigation.addEventListener('navigatesuccess', () => onPage());
  } else {
    window.addEventListener('popstate', () => onPage());
  }

  retargetLinks(path => (isSub(path) ? hot(path) : null));

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
