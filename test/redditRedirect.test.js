'use strict';
// Runs the userscript against hand-made fakes of location, navigation and document.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'redditRedirect.user.js'), 'utf8');

// Loads the script at `pathname`; `withNavigation: false` simulates a browser without
// the Navigation API. Returns the fakes so tests can fire events and read the calls.
const load = (pathname, { search = '', withNavigation = true } = {}) => {
  const calls = { replace: [], assign: [] };
  const location = {
    pathname, search, hostname: 'www.reddit.com',
    replace: url => calls.replace.push(url),
    assign: url => calls.assign.push(url),
  };
  const docListeners = {};
  const winListeners = {};
  const navListeners = {};
  const on = store => (type, fn, capture) => { (store[type] ||= []).push({ fn, capture }); };
  const document = { addEventListener: on(docListeners) };
  const navigation = withNavigation ? { addEventListener: on(navListeners) } : undefined;
  const window = { addEventListener: on(winListeners), navigation };
  new Function('window', 'document', 'location', 'navigation', 'history', src)(
    window, document, location, navigation, {});
  return { calls, location, docListeners, winListeners, navListeners };
};

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

test('loading the front page replaces it with /hot, keeping the query', () => {
  assert.deepEqual(load('/').calls.replace, ['/hot']);
  assert.deepEqual(load('/', { search: '?feed=home' }).calls.replace, ['/hot?feed=home']);
});

test('loading any other page does nothing', () => {
  for (const p of ['/hot', '/r/x', '/r/x/comments/abc/title/']) {
    const { calls } = load(p);
    assert.deepEqual(calls, { replace: [], assign: [] });
  }
});

test('in-app navigation to the front page redirects (Navigation API)', () => {
  const t = load('/hot');
  assert.equal(t.navListeners.navigatesuccess.length, 1);
  assert.equal(t.winListeners.popstate, undefined);
  t.location.pathname = '/';
  fire(t.navListeners, 'navigatesuccess');
  assert.deepEqual(t.calls.replace, ['/hot']);
});

test('in-app navigation elsewhere does nothing', () => {
  const t = load('/hot');
  t.location.pathname = '/r/x';
  fire(t.navListeners, 'navigatesuccess');
  assert.deepEqual(t.calls.replace, []);
});

test('without the Navigation API, popstate is used instead', () => {
  const t = load('/hot', { withNavigation: false });
  assert.equal(t.winListeners.popstate.length, 1);
  t.location.pathname = '/';
  fire(t.winListeners, 'popstate');
  assert.deepEqual(t.calls.replace, ['/hot']);
  t.location.pathname = '/r/x';
  fire(t.winListeners, 'popstate');
  assert.deepEqual(t.calls.replace, ['/hot']);
});

test('a plain click on the logo goes to /hot', () => {
  const t = load('/r/x');
  assert.equal(t.docListeners.click.length, 1);
  assert.equal(t.docListeners.click[0].capture, true);
  const e = clickEvent(true);
  fire(t.docListeners, 'click', e);
  assert.equal(e.prevented, true);
  assert.deepEqual(t.calls.assign, ['/hot']);
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
