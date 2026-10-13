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
    preventDefault() { e.prevented = true; },
    stopPropagation() {},
  };
  return e;
};

const POST = '/r/x/comments/abc/title/';

test('the front page opens on old Reddit\'s Hot, keeping the query and hash', () => {
  assert.deepEqual(load('/').calls.replace, [HOT]);
  assert.deepEqual(load('/', { search: '?feed=home', hash: '#a' }).calls.replace, [HOT + '?feed=home#a']);
  for (const p of ['/hot', '/hot/', '/best', '/best/']) assert.deepEqual(load(p).calls.replace, [HOT]);
});

test('every other page opens on old Reddit at the same address', () => {
  for (const p of [POST, '/r/x', '/new', '/user/a', '/user/a/m/b/hot/', '/search', '/submit', '/r/xs/']) {
    assert.deepEqual(load(p).calls.replace, [OLD + p], p);
  }
  assert.deepEqual(load('/search', { search: '?q=cats', hash: '#x' }).calls.replace, [OLD + '/search?q=cats#x']);
});

test('pages only the new design has stay', () => {
  for (const p of ['/settings', '/settings/account', '/media', '/chat', '/login', '/notifications',
    '/mod/x/queue', '/r/x/s/AbC123', '/u/a/s/AbC123', '/explore', '/t/football']) {
    assert.deepEqual(load(p).calls, { replace: [], assign: [] }, p);
  }
});

test('in-app navigation is sent on to old Reddit (Navigation API)', () => {
  const t = load('/settings');
  assert.equal(t.navListeners.navigatesuccess.length, 1);
  assert.equal(t.winListeners.popstate, undefined);
  t.location.pathname = '/';
  fire(t.navListeners, 'navigatesuccess');
  t.location.pathname = POST;
  fire(t.navListeners, 'navigatesuccess');
  t.location.pathname = '/chat';
  fire(t.navListeners, 'navigatesuccess');
  assert.deepEqual(t.calls.replace, [HOT, OLD + POST]);
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
  assert.equal(t.docListeners.click.length, 1);
  assert.equal(t.docListeners.click[0].capture, true);
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
  assert.deepEqual(load(POST, { store, now: 1e12 + 5000 }).calls.replace, []);
});

test('turned away from a post: it stays, and the front page uses the last custom feed', () => {
  const store = {};
  assert.deepEqual(load('/user/Some_one/m/my-feed/new/', { store }).calls.replace,
    [OLD + '/user/Some_one/m/my-feed/new/']); // remembered on the way through
  assert.equal(store['rhr:feed'], '/user/Some_one/m/my-feed');
  load(POST, { store, now: 1e12 });
  assert.deepEqual(load(POST, { store, now: 1e12 + 3000 }).calls.replace, []);
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
  assert.deepEqual(load(POST, { store, now: 1e12 + 3000 + DAY + 1 }).calls.replace, [OLD + POST]);
});

test('other pages soon after, or the same page later, are not a turn-away', () => {
  const store = {};
  load(POST, { store, now: 1e12 });
  load('/media', { store, now: 1e12 + 2000 }); // e.g. an image link on old Reddit
  load('/r/y', { store, now: 1e12 + 4000 });
  assert.equal(store['rhr:oldRefused'], undefined);
  load(POST, { store, now: 1e12 });
  assert.deepEqual(load(POST, { store, now: 1e12 + 60e3 }).calls.replace, [OLD + POST]);
  assert.equal(store['rhr:oldRefused'], undefined);
});

test('bad stored values are ignored', () => {
  const store = { 'rhr:oldRefused': 'soon', 'rhr:oldTried': '-5', 'rhr:feed': 'javascript:alert(1)' };
  assert.deepEqual(load('/', { store }).calls.replace, [HOT]);
  const s2 = { 'rhr:oldRefused': String(1e12), 'rhr:feed': '//evil.example/user/a/m/b' };
  assert.deepEqual(load('/', { store: s2, now: 1e12 + 1000 }).calls.replace, []);
});

test('without storage the redirect still works', () => {
  assert.deepEqual(load('/', { noStorage: true }).calls.replace, [HOT]);
  assert.deepEqual(load(POST, { noStorage: true }).calls.replace, [OLD + POST]);
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

test('old Reddit: the bare front page goes to Hot, nothing else is touched', () => {
  const old = { hostname: 'old.reddit.com' };
  assert.deepEqual(load('/', old).calls.replace, ['/hot']);
  assert.deepEqual(load('/', { ...old, search: '?count=25', hash: '#t' }).calls.replace, ['/hot?count=25#t']);
  for (const p of ['/hot', '/best', '/new', POST, '/r/x']) assert.deepEqual(load(p, old).calls.replace, [], p);
  const store = {};
  const t = load(POST, { ...old, store });
  assert.deepEqual(store, {});
  assert.equal(t.docListeners.click, undefined);
  assert.equal(t.navListeners.navigatesuccess, undefined);
  t.location.pathname = '/';
  fire(t.docListeners, 'visibilitychange');
  assert.deepEqual(t.calls.replace, ['/hot']);
});
