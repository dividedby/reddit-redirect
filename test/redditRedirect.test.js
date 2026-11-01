'use strict';
// Runs the userscript against hand-made fakes of location, navigation and document.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'redditRedirect.user.js'), 'utf8');

// Loads the script at `pathname`; `withNavigation: false` simulates a browser without
// the Navigation API, `store` is localStorage's contents (shared between loads to simulate
// later page loads), `now` the clock. Returns the fakes so tests can fire events and read calls.
const load = (pathname, { search = '', hash = '', withNavigation = true, store = {}, now = 1e12, noStorage = false, hostname = 'www.reddit.com' } = {}) => {
  const calls = { replace: [], assign: [] };
  const location = {
    pathname, search, hash, hostname,
    replace: url => calls.replace.push(url),
    assign: url => calls.assign.push(url),
  };
  const docListeners = {};
  const winListeners = {};
  const navListeners = {};
  const on = l => (type, fn, capture) => { (l[type] ||= []).push({ fn, capture }); };
  const document = { addEventListener: on(docListeners), visibilityState: 'visible' };
  const navigation = withNavigation ? { addEventListener: on(navListeners) } : undefined;
  const window = { addEventListener: on(winListeners), navigation };
  const deny = () => { throw new Error('SecurityError'); };
  const localStorage = noStorage ? { getItem: deny, setItem: deny } : {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
  };
  const clock = { now };
  const FakeDate = { now: () => clock.now };
  new Function('window', 'document', 'location', 'navigation', 'history', 'localStorage', 'Date', src)(
    window, document, location, navigation, {}, localStorage, FakeDate);
  return { calls, location, document, docListeners, winListeners, navListeners, store, clock };
};

const OLD = 'https://old.reddit.com';
const HOT = OLD + '/hot';
const DAY = 864e5;

const fire = (listeners, type, event = {}) => (listeners[type] || []).forEach(l => l.fn(event));

const clickEvent = (onLogo, mods = {}) => {
  const e = {
    button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...mods,
    prevented: false,
    target: { closest: sel => (onLogo && sel === '#reddit-logo' ? {} : null) },
    composedPath: () => [],
    preventDefault() { e.prevented = true; },
    stopPropagation() {},
  };
  return e;
};

const POST = '/r/x/comments/abc/title/';
const FEEDS = ['/new', '/top/', '/r/all', '/r/all/', '/r/All-pics-funny/top/', '/r/popular/',
  '/r/popular/rising', '/r/a+b/', '/r/a+b+c/new/', '/user/a/m/b/hot/', '/user/Some_one/m/my-feed',
  '/u/a/m/b/', '/r/friends/', '/r/mod', '/r/random', '/r/randnsfw/new/'];
// Posts and other pages under a feed's address, which are not feeds.
const UNDER_FEEDS = ['/r/all/comments/abc/t/', '/r/popular/comments/abc/t/', '/r/a+b/comments/abc/t/',
  '/user/a/m/b/comments/abc/t/', '/r/popular/about', '/r/all/search'];

// A link at `href` (resolved against `base`), and a click on it as the browser sends it.
const linkClick = (href, base = 'https://old.reddit.com/hot') => {
  const u = new URL(href, base);
  const a = { localName: 'a', hostname: u.hostname, pathname: u.pathname, search: u.search, hash: u.hash };
  Object.defineProperty(a, 'href', {
    get: () => u.href,
    set: v => { a.set = v; },
    enumerable: true,
  });
  const e = clickEvent(false);
  e.composedPath = () => [{ localName: 'span' }, a, { localName: 'div' }];
  return { a, e };
};

test('the front page opens on old Reddit\'s Hot, keeping the query and hash', () => {
  assert.deepEqual(load('/').calls.replace, [HOT]);
  assert.deepEqual(load('/', { search: '?feed=home', hash: '#a' }).calls.replace, [HOT + '?feed=home#a']);
  for (const p of ['/hot', '/hot/', '/best', '/best/']) assert.deepEqual(load(p).calls.replace, [HOT]);
});

test('feeds open on old Reddit at the same address', () => {
  for (const p of FEEDS) assert.deepEqual(load(p).calls.replace, [OLD + p], p);
  assert.deepEqual(load('/r/popular/', { search: '?geo_filter=GLOBAL', hash: '#x' }).calls.replace,
    [OLD + '/r/popular/?geo_filter=GLOBAL#x']);
});

test('a subreddit opens sorted by Hot on the new design', () => {
  for (const p of ['/r/x', '/r/x/', '/r/Some_Sub2/', '/r/allergies', '/r/popularity/', '/R/x',
    '/r/modnews', '/r/randomthoughts']) {
    assert.deepEqual(load(p).calls.replace, [p.replace(/\/?$/, '/hot/')], p);
  }
  assert.deepEqual(load('/r/x', { search: '?f=y', hash: '#z' }).calls.replace, ['/r/x/hot/?f=y#z']);
});

test('posts, sorted subreddits and every other page stay on the new design', () => {
  for (const p of [POST, '/r/x/hot/', '/r/x/new', '/r/x/top/', '/r/x/wiki', '/r/allergies/new/',
    '/user/a', '/u/a/', '/search', '/submit', '/settings',
    '/chat', '/media', '/r/x/s/AbC123', '/message/inbox', '/prefs', ...UNDER_FEEDS]) {
    assert.deepEqual(load(p).calls, { replace: [], assign: [] }, p);
  }
});

test('in-app navigation is sent on the same way (Navigation API)', () => {
  const t = load('/settings');
  assert.equal(t.navListeners.navigatesuccess.length, 1);
  assert.equal(t.winListeners.popstate, undefined);
  for (const p of ['/', POST, '/r/popular/', '/r/x', '/r/x/hot/', '/chat']) {
    t.location.pathname = p;
    fire(t.navListeners, 'navigatesuccess');
  }
  assert.deepEqual(t.calls.replace, [HOT, OLD + '/r/popular/', '/r/x/hot/']);
});

test('without the Navigation API, popstate is used instead', () => {
  const t = load('/settings', { withNavigation: false });
  assert.equal(t.winListeners.popstate.length, 1);
  t.location.pathname = '/';
  fire(t.winListeners, 'popstate');
  assert.deepEqual(t.calls.replace, [HOT]);
});

test('a plain click on the logo goes to old Reddit\'s Hot', () => {
  const t = load('/settings');
  assert.equal(t.docListeners.click.length, 2);
  assert.ok(t.docListeners.click.every(l => l.capture === true));
  const e = clickEvent(true);
  fire(t.docListeners, 'click', e);
  assert.equal(e.prevented, true);
  assert.deepEqual(t.calls.assign, [HOT]);
});

test('modified and non-left clicks on the logo are left to the browser', () => {
  const cases = [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }];
  for (const mods of cases) {
    const t = load('/settings');
    const e = clickEvent(true, mods);
    fire(t.docListeners, 'click', e);
    assert.equal(e.prevented, false);
    assert.deepEqual(t.calls.assign, []);
  }
});

test('clicks elsewhere are left alone', () => {
  const t = load('/settings');
  const e = clickEvent(false);
  fire(t.docListeners, 'click', e);
  assert.equal(e.prevented, false);
  assert.deepEqual(t.calls.assign, []);
});

test('turned away from the front page with no custom feed: everything stays', () => {
  const store = {};
  load('/', { store, now: 1e12 });
  const t = load('/', { store, now: 1e12 + 3000 });
  assert.deepEqual(t.calls.replace, []);
  assert.equal(store['rhr:oldRefused'], String(1e12 + 3000));
  const e = clickEvent(true);
  fire(t.docListeners, 'click', e);
  assert.equal(e.prevented, false);
  assert.deepEqual(load('/r/popular/', { store, now: 1e12 + 5000 }).calls.replace, []);
  assert.deepEqual(load('/r/x', { store, now: 1e12 + 6000 }).calls.replace, ['/r/x/hot/']);
});

test('turned away from a feed: it stays, and the front page uses the last custom feed', () => {
  const store = {};
  assert.deepEqual(load('/user/Some_one/m/my-feed/new/', { store }).calls.replace,
    [OLD + '/user/Some_one/m/my-feed/new/']); // remembered on the way through
  assert.equal(store['rhr:feed'], '/user/Some_one/m/my-feed');
  load('/r/popular/', { store, now: 1e12 });
  assert.deepEqual(load('/r/popular/', { store, now: 1e12 + 3000 }).calls.replace, []);
  assert.deepEqual(load('/user/Some_one/m/my-feed/hot/', { store, now: 1e12 + 4000 }).calls.replace, []);
  const t = load('/', { store, now: 1e12 + DAY / 2 });
  assert.deepEqual(t.calls.replace, ['/user/Some_one/m/my-feed/hot/']);
  const e = clickEvent(true);
  fire(t.docListeners, 'click', e);
  assert.deepEqual(t.calls.assign, ['/user/Some_one/m/my-feed/hot/']);
});

test('old Reddit is tried again a day after a turn-away', () => {
  const store = {};
  load('/', { store, now: 1e12 });
  load('/', { store, now: 1e12 + 3000 });
  assert.deepEqual(load('/r/all', { store, now: 1e12 + 3000 + DAY + 1 }).calls.replace, [OLD + '/r/all']);
});

test('other pages soon after, or the same page later, are not a turn-away', () => {
  const store = {};
  load('/r/popular/', { store, now: 1e12 });
  load(POST, { store, now: 1e12 + 2000 }); // a post opened from old Reddit
  load('/r/y', { store, now: 1e12 + 4000 });
  assert.equal(store['rhr:oldRefused'], undefined);
  const later = {};
  load('/r/popular/', { store: later, now: 1e12 });
  assert.deepEqual(load('/r/popular/', { store: later, now: 1e12 + 60e3 }).calls.replace, [OLD + '/r/popular/']);
  assert.equal(later['rhr:oldRefused'], undefined);
});

test('bad stored values are ignored', () => {
  const store = { 'rhr:oldRefused': 'soon', 'rhr:oldTried': '-5', 'rhr:feed': 'javascript:alert(1)' };
  assert.deepEqual(load('/', { store }).calls.replace, [HOT]);
  const s2 = { 'rhr:oldRefused': String(1e12), 'rhr:feed': '//evil.example/user/a/m/b' };
  assert.deepEqual(load('/', { store: s2, now: 1e12 + 1000 }).calls.replace, []);
});

test('without storage the redirect still works', () => {
  assert.deepEqual(load('/', { noStorage: true }).calls.replace, [HOT]);
  assert.deepEqual(load('/r/all', { noStorage: true }).calls.replace, [OLD + '/r/all']);
  assert.deepEqual(load('/r/x', { noStorage: true }).calls.replace, ['/r/x/hot/']);
});

test('a page loaded in the background is checked again when shown (Safari preload)', () => {
  const store = {};
  const t = load('/settings', { store });
  t.location.pathname = '/';
  t.document.visibilityState = 'hidden';
  fire(t.docListeners, 'visibilitychange');
  assert.deepEqual(t.calls.replace, []);
  t.document.visibilityState = 'visible';
  fire(t.docListeners, 'visibilitychange');
  fire(t.docListeners, 'visibilitychange'); // a lost redirect retried is not a turn-away
  assert.deepEqual(t.calls.replace, [HOT, HOT]);
  assert.equal(store['rhr:oldRefused'], undefined);
});

test('old Reddit: the bare front page goes to Hot, no page is redirected', () => {
  const old = { hostname: 'old.reddit.com' };
  assert.deepEqual(load('/', old).calls.replace, ['/hot']);
  assert.deepEqual(load('/', { ...old, search: '?count=25', hash: '#t' }).calls.replace, ['/hot?count=25#t']);
  for (const p of ['/hot', '/best', '/new', POST, '/r/x']) assert.deepEqual(load(p, old).calls.replace, [], p);
  const store = {};
  const t = load(POST, { ...old, store });
  assert.deepEqual(store, {});
  assert.equal(t.navListeners.navigatesuccess, undefined);
  t.location.pathname = '/';
  fire(t.docListeners, 'visibilitychange');
  assert.deepEqual(t.calls.replace, ['/hot']);
});

test('old Reddit: links to posts, subreddits and profiles open on the new design', () => {
  const t = load('/hot', { hostname: 'old.reddit.com' });
  for (const type of ['click', 'auxclick', 'contextmenu']) {
    assert.equal(t.docListeners[type].length, 1, type);
    assert.equal(t.docListeners[type][0].capture, true, type);
  }
  const cases = [
    [POST + '?context=3#c', 'https://www.reddit.com' + POST + '?context=3#c'],
    ['https://old.reddit.com/r/x/', 'https://www.reddit.com/r/x/hot/'],
    ['/r/Sub_2', 'https://www.reddit.com/r/Sub_2/hot/'],
    ['/r/x/new/', 'https://www.reddit.com/r/x/new/'],
    ['/user/a', 'https://www.reddit.com/user/a'],
    ['/u/a/comments/', 'https://www.reddit.com/u/a/comments/'],
    ...UNDER_FEEDS.map(p => [p, 'https://www.reddit.com' + p]),
  ];
  for (const type of ['click', 'auxclick', 'contextmenu']) {
    for (const [href, want] of cases) {
      const { a, e } = linkClick(href);
      fire(t.docListeners, type, e);
      assert.equal(a.set, want, `${type} ${href}`);
      assert.equal(e.prevented, false); // the browser follows the link as usual
    }
  }
});

test('old Reddit: feed, other-site and other-page links are left alone', () => {
  const t = load('/hot', { hostname: 'old.reddit.com' });
  for (const href of [...FEEDS, '/', '/hot?count=25&after=t3_x', '/prefs', '/message/inbox',
    '/submit', '/search?q=x', 'https://example.com/r/x/', 'https://www.reddit.com/r/x/', 'https://i.redd.it/a.jpg']) {
    const { a, e } = linkClick(href);
    fire(t.docListeners, 'click', e);
    assert.equal(a.set, undefined, href);
  }
  const e = clickEvent(false); // a click that isn't on a link
  e.composedPath = () => [{ localName: 'div' }];
  fire(t.docListeners, 'click', e);
});

test('new design: subreddit links get Hot before Reddit follows them', () => {
  const t = load(POST);
  const base = 'https://www.reddit.com/';
  for (const [href, want] of [['/r/x/', '/r/x/hot/'], ['https://www.reddit.com/r/x', '/r/x/hot/']]) {
    const { a, e } = linkClick(href, base);
    fire(t.docListeners, 'auxclick', e);
    assert.equal(a.set, want, href);
  }
  for (const href of [POST, '/r/x/new/', '/r/popular/', '/', 'https://old.reddit.com/r/x/']) {
    const { a, e } = linkClick(href, base);
    fire(t.docListeners, 'click', e);
    assert.equal(a.set, undefined, href);
  }
});
