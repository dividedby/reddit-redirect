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
const load = (pathname, { search = '', withNavigation = true, store = {}, now = 1e12, noStorage = false, hostname = 'www.reddit.com', logo = null } = {}) => {
  const calls = { replace: [], assign: [] };
  const location = {
    pathname, search, hostname, href: `https://${hostname}${pathname}${search}`,
    replace: url => calls.replace.push(url),
    assign: url => calls.assign.push(url),
  };
  const docListeners = {};
  const winListeners = {};
  const navListeners = {};
  const on = l => (type, fn, capture) => { (l[type] ||= []).push({ fn, capture }); };
  const document = { addEventListener: on(docListeners), visibilityState: 'visible',
    getElementById: id => (id === 'header-img-a' ? logo : null) };
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

const OLD = 'https://old.reddit.com/hot';
const DAY = 864e5;

const fire = (listeners, type, event = {}) => (listeners[type] || []).forEach(l => l.fn(event));

const clickEvent = (onLogo, mods = {}) => {
  const e = {
    button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...mods,
    prevented: false,
    target: { closest: sel => (onLogo && sel === '#reddit-logo' ? {} : null) },
    preventDefault() { e.prevented = true; },
    stopPropagation() {},
  };
  return e;
};

test('loading the front page sends you to old Reddit\'s Hot, keeping the query', () => {
  assert.deepEqual(load('/').calls.replace, [OLD]);
  assert.deepEqual(load('/', { search: '?feed=home' }).calls.replace, [OLD + '?feed=home']);
  for (const p of ['/hot', '/hot/', '/best', '/best/']) assert.deepEqual(load(p).calls.replace, [OLD]);
});

test('loading any other page does nothing', () => {
  for (const p of ['/new', '/r/x', '/r/x/hot', '/r/x/comments/abc/title/', '/user/a/m/b/hot/']) {
    const { calls } = load(p);
    assert.deepEqual(calls, { replace: [], assign: [] });
  }
});

test('in-app navigation to the front page redirects (Navigation API)', () => {
  const t = load('/r/y');
  assert.equal(t.navListeners.navigatesuccess.length, 1);
  assert.equal(t.winListeners.popstate, undefined);
  t.location.pathname = '/';
  fire(t.navListeners, 'navigatesuccess');
  assert.deepEqual(t.calls.replace, [OLD]);
});

test('in-app navigation elsewhere does nothing', () => {
  const t = load('/r/y');
  t.location.pathname = '/r/x';
  fire(t.navListeners, 'navigatesuccess');
  assert.deepEqual(t.calls.replace, []);
});

test('without the Navigation API, popstate is used instead', () => {
  const t = load('/r/y', { withNavigation: false });
  assert.equal(t.winListeners.popstate.length, 1);
  t.location.pathname = '/';
  fire(t.winListeners, 'popstate');
  assert.deepEqual(t.calls.replace, [OLD]);
  t.location.pathname = '/r/x';
  fire(t.winListeners, 'popstate');
  assert.deepEqual(t.calls.replace, [OLD]);
});

test('a plain click on the logo goes to old Reddit\'s Hot', () => {
  const t = load('/r/x');
  assert.equal(t.docListeners.click.length, 1);
  assert.equal(t.docListeners.click[0].capture, true);
  const e = clickEvent(true);
  fire(t.docListeners, 'click', e);
  assert.equal(e.prevented, true);
  assert.deepEqual(t.calls.assign, [OLD]);
});

test('modified and non-left clicks on the logo are left to the browser', () => {
  const cases = [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }];
  for (const mods of cases) {
    const t = load('/r/x');
    const e = clickEvent(true, mods);
    fire(t.docListeners, 'click', e);
    assert.equal(e.prevented, false);
    assert.deepEqual(t.calls.assign, []);
  }
});

test('clicks elsewhere are left alone', () => {
  const t = load('/r/x');
  const e = clickEvent(false);
  fire(t.docListeners, 'click', e);
  assert.equal(e.prevented, false);
  assert.deepEqual(t.calls.assign, []);
});

// old Reddit sends you back to the front page right after the redirect
const bounce = (store, now) => load('/', { store, now });

test('turned away by old Reddit with no custom feed: the front page is left alone', () => {
  const store = {};
  load('/', { store, now: 1e12 });
  const t = bounce(store, 1e12 + 3000);
  assert.deepEqual(t.calls.replace, []);
  assert.equal(store['rhr:oldRefused'], String(1e12 + 3000));
  const e = clickEvent(true);
  fire(t.docListeners, 'click', e);
  assert.equal(e.prevented, false);
  assert.deepEqual(t.calls.assign, []);
});

test('turned away by old Reddit: the last custom feed you opened, sorted Hot', () => {
  const store = {};
  load('/user/Some_one/m/my-feed/new/', { store }); // remembered, not redirected
  assert.equal(store['rhr:feed'], '/user/Some_one/m/my-feed');
  load('/', { store, now: 1e12 });
  const t = bounce(store, 1e12 + 3000);
  assert.deepEqual(t.calls.replace, ['/user/Some_one/m/my-feed/hot/']);
  const e = clickEvent(true);
  fire(t.docListeners, 'click', e);
  assert.deepEqual(t.calls.assign, ['/user/Some_one/m/my-feed/hot/']);
  // and later loads keep using it for the day
  assert.deepEqual(load('/', { store, now: 1e12 + DAY / 2 }).calls.replace, ['/user/Some_one/m/my-feed/hot/']);
});

test('old Reddit is tried again a day after a turn-away', () => {
  const store = {};
  load('/', { store, now: 1e12 });
  bounce(store, 1e12 + 3000);
  const t = load('/', { store, now: 1e12 + 3000 + DAY + 1 });
  assert.deepEqual(t.calls.replace, [OLD]);
  // a second turn-away starts a new day
  assert.deepEqual(bounce(store, 1e12 + DAY + 9000).calls.replace, []);
});

test('coming back to the front page later is not a turn-away', () => {
  const store = {};
  load('/', { store, now: 1e12 });
  const t = load('/', { store, now: 1e12 + 60e3 });
  assert.deepEqual(t.calls.replace, [OLD]);
  assert.equal(store['rhr:oldRefused'], undefined);
});

test('bad stored values are ignored', () => {
  const store = { 'rhr:oldRefused': 'soon', 'rhr:oldTried': '-5', 'rhr:feed': 'javascript:alert(1)' };
  assert.deepEqual(load('/', { store }).calls.replace, [OLD]);
  const s2 = { 'rhr:oldRefused': String(1e12), 'rhr:feed': '//evil.example/user/a/m/b' };
  assert.deepEqual(load('/', { store: s2, now: 1e12 + 1000 }).calls.replace, []);
});

test('without storage the redirect still works', () => {
  assert.deepEqual(load('/', { noStorage: true }).calls.replace, [OLD]);
  assert.deepEqual(load('/user/a/m/b', { noStorage: true }).calls.replace, []);
});

test('a front page loaded in the background is checked again when shown (Safari preload)', () => {
  const t = load('/r/y');
  t.location.pathname = '/';
  t.document.visibilityState = 'hidden';
  fire(t.docListeners, 'visibilitychange');
  assert.deepEqual(t.calls.replace, []);
  t.document.visibilityState = 'visible';
  fire(t.docListeners, 'visibilitychange');
  assert.deepEqual(t.calls.replace, [OLD]);
});

test('old Reddit: the logo is pointed at Hot once the page is parsed', () => {
  const logo = { href: 'https://old.reddit.com/' };
  const t = load('/r/x/comments/abc/title/', { hostname: 'old.reddit.com', logo });
  assert.equal(logo.href, 'https://old.reddit.com/');
  fire(t.docListeners, 'DOMContentLoaded');
  assert.equal(logo.href, '/hot');
  // nothing else: no redirect, no logo click handler, no history listeners
  assert.deepEqual(t.calls, { replace: [], assign: [] });
  assert.equal(t.docListeners.click, undefined);
  assert.equal(t.navListeners.navigatesuccess, undefined);
});

test('old Reddit: the front page itself and a subreddit\'s own logo are left alone', () => {
  assert.deepEqual(load('/', { hostname: 'old.reddit.com' }).calls.replace, []);
  const logo = { href: 'https://old.reddit.com/r/x/' };
  const t = load('/r/x/', { hostname: 'old.reddit.com', logo });
  fire(t.docListeners, 'DOMContentLoaded');
  assert.equal(logo.href, 'https://old.reddit.com/r/x/');
  fire(load('/', { hostname: 'old.reddit.com' }).docListeners, 'DOMContentLoaded'); // no logo: no error
});
