// ==UserScript==
// @name        Reddit Hot Redirect with Logo Click Handler
// @namespace   https://greasyfork.org/en/users/594496-divided-by
// @author      dividedby
// @description Opens Reddit's feeds in old Reddit, with the front page on Hot, and subreddits on Hot. The logo goes there too
// @version     2.5
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
//   - if old Reddit sent you back here without showing you a listing, feeds stay here in the
//     old design, using a cookie Reddit honors, and the front page goes to /hot. If that stops
//     working, feeds stay on the new design and the front page goes to your custom feed sorted
//     by Hot (the custom feed you last opened here), or, with none, is left alone.
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

  // Old Reddit's listing shown: a time, in a cookie because the two hosts' localStorage is
  // separate. It's what tells coming back on purpose from being turned away.
  const SEEN_COOKIE = 'rhr_old_seen';

  // With this cookie, www serves the old design. Old Reddit's pages set it for all of reddit.com
  // (loading any page does, and so does saving a post), which would put posts and subreddits
  // in the old design too.
  const OPT_OUT = 'redesign_optout';
  const clearOptOut = () => {
    document.cookie = `${OPT_OUT}=; domain=.reddit.com; path=/; max-age=0`;
  };
  // A save sets it again while you're on the page. Clear it as it appears, where the browser
  // can say so: a request you start next goes out before the page can react to leaving.
  const clearOptOutAsItAppears = when => {
    window.cookieStore?.addEventListener('change', e => {
      if (when() && e.changed.some(c => c.name === OPT_OUT)) clearOptOut();
    });
  };

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
    clearOptOut();
    clearOptOutAsItAppears(() => true);
    const toHot = () => {
      if (location.pathname === '/') location.replace('/hot' + location.search + location.hash);
    };
    toHot();
    // Safari can load a page you're typing before you open it ("Preload Top Hit"); a
    // redirect made then can be lost, so check again once the page is shown.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') toHot();
      else clearOptOut();
    });
    retargetLinks(path => {
      if (!/^\/(r|u|user)\//i.test(path) || OLD_FEED.test(path)) return null;
      clearOptOut();
      return NEW + (isSub(path) ? hot(path) : path);
    });
    const markSeen = () => {
      clearOptOut();
      if (!document.getElementById('siteTable')) return; // the log-in page, say
      document.cookie = `${SEEN_COOKIE}=${Date.now()}; domain=.reddit.com; path=/; max-age=60; secure; samesite=lax`;
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markSeen);
    else markSeen();
    return;
  }

  const KEY_TRIED = 'rhr:oldTried';     // when we last sent you to old Reddit (ms)
  const KEY_TRIED_PATH = 'rhr:oldPath'; // and from which page
  const KEY_REFUSED = 'rhr:oldRefused'; // when old Reddit last sent you back (ms)
  const KEY_FEED = 'rhr:feed';          // custom feed path, e.g. /user/name/m/feed
  const KEY_HOT_TRIED = 'rhr:hotTried'; // when we last sent you to www/hot, until it shows a listing
  const KEY_FALLBACK_OFF = 'rhr:fallbackOff'; // when feeds in the old design here last failed (ms)
  const BOUNCE_MS = 15e3;               // back here this soon = sent back
  const RETRY_MS = 864e5;               // try old Reddit again after a day

  // The front page under any of its names; '/hot' and '/best' show Best on the new design.
  const FRONT = /^\/(hot|best)?\/?$/;
  const FEED = /^\/user\/[\w-]+\/m\/[\w-]+/;
  // Where the cookie goes when old Reddit has turned you away: on these paths only, so posts and
  // subreddits stay on the new design. The front page can't have it (its path is every path),
  // so it goes to /hot. Other feeds (a custom feed, r/all-x) get it as you open them.
  const FEED_PATHS = ['/hot', '/new', '/rising', '/top', '/controversial', '/r/all', '/r/popular',
    '/r/friends', '/r/mod', '/r/random', '/r/randnsfw'];
  const feedRoot = path => path.match(/^\/(r\/[^/]+|u(ser)?\/[\w-]+\/m\/[\w-]+|\w+)/i)[0];
  const setOptOut = (paths, maxAge) => {
    for (const p of paths) {
      document.cookie = `${OPT_OUT}=${maxAge ? 'true' : ''}; path=${p}; max-age=${maxAge}; secure; samesite=lax`;
    }
  };

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
  const fallback = () => refused() && Date.now() - time(KEY_FALLBACK_OFF) > RETRY_MS;
  const fallbackFailed = () => {
    write(KEY_FALLBACK_OFF, String(Date.now()));
    setOptOut(FEED_PATHS, 0);
  };
  const hasOptOut = () => new RegExp(`(?:^|; )${OPT_OUT}=`).test(document.cookie);
  const isHot = path => /^\/hot\/?$/.test(path);
  // When old Reddit last showed you a listing, or 0.
  const seen = () => {
    const m = document.cookie.match(new RegExp(`(?:^|; )${SEEN_COOKIE}=(\\d+)(?:;|$)`));
    const n = m ? Number(m[1]) : 0;
    return n <= Date.now() ? n : 0;
  };

  // Where a page should go: a URL, or null to stay. `rest` is the query and hash.
  const target = (path, rest = '') => {
    if (isSub(path)) return hot(path) + rest;
    if (!refused()) {
      if (FRONT.test(path)) return OLD + '/hot' + rest;
      return OLD_FEED.test(path) ? OLD + path + rest : null;
    }
    if (!FRONT.test(path)) return null;
    if (fallback()) return isHot(path) ? null : '/hot' + rest;
    const f = feed();
    return f ? f + '/hot/' : null;
  };

  const go = (how, url, path) => {
    if (url.startsWith(OLD)) {
      write(KEY_TRIED, String(Date.now()));
      write(KEY_TRIED_PATH, path);
    } else if (isHot(url.split(/[?#]/)[0])) {
      write(KEY_HOT_TRIED, String(Date.now()));
    }
    location[how](url);
  };

  // Turned away: a feed here in the old design. Returns false if the page is being loaded again.
  const showFeedsOld = (path, rest, loaded) => {
    const carried = hasOptOut(); // one this page can see went out with its request
    clearOptOut();
    const feedPage = OLD_FEED.test(path) && !(FRONT.test(path) && !isHot(path));
    setOptOut(new Set([...FEED_PATHS, ...(feedPage ? [feedRoot(path)] : [])]), RETRY_MS / 1000);
    if (FRONT.test(path) && !isHot(path)) {
      // Without the cookie Reddit answers /hot with a redirect here. Don't loop on that.
      if (loaded === true && Date.now() - time(KEY_HOT_TRIED) < BOUNCE_MS) fallbackFailed();
      return true;
    }
    if (!feedPage) return true;
    const shown = loaded === true ? carried
      : document.readyState === 'loading' || !!document.getElementById('siteTable');
    if (!shown) {
      if (!hasOptOut()) { // cookies are blocked
        fallbackFailed();
        return true;
      }
      location.replace(path + rest);
      return false;
    }
    if (loaded === true) {
      const check = () => {
        if (document.getElementById('siteTable')) {
          write(KEY_HOT_TRIED, '0');
        } else {
          fallbackFailed();
          onPage();
        }
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check);
      else check();
    }
    return true;
  };

  // `loaded`: a fresh page load, the only time old Reddit can have just sent you back. A
  // listing shown since then means it let you in, and you came back yourself.
  const onPage = loaded => {
    const path = location.pathname;
    const f = path.match(FEED);
    if (f) write(KEY_FEED, f[0]);
    const now = Date.now();
    if (loaded === true && !refused() && now - time(KEY_TRIED) < BOUNCE_MS
      && (path === read(KEY_TRIED_PATH) || FRONT.test(path)) && seen() < time(KEY_TRIED)) {
      write(KEY_REFUSED, String(now)); // sent to old Reddit moments ago and back: turned away
    }
    const rest = location.search + location.hash;
    if (fallback() && !showFeedsOld(path, rest, loaded)) return;
    const url = target(path, rest);
    // replace() so Back skips this page instead of landing on it and redirecting again
    if (url) go('replace', url, path);
  };

  clearOptOutAsItAppears(fallback);
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
