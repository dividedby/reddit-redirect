// Prototype of the feed restyle for old Reddit's feed pages (front page, r/all, r/popular,
// custom feeds). Adds `rr` to <html>, a small app bar, and per-post header/media/pills.
// Everything reuses Reddit's own elements (vote arrows, save, hide) so their handlers work.
(() => {
  'use strict';
  const root = document.documentElement;
  if (root.classList.contains('rr')) return; // safe to run twice
  root.classList.add('rr');

  // Old Reddit declares a 1024px viewport, which a phone shows as a shrunken desktop page.
  const setViewport = () => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      (document.head || root).append(meta);
    }
    meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
  };

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };
  const SVG = 'http://www.w3.org/2000/svg';
  const icon = d => {
    const s = document.createElementNS(SVG, 'svg');
    s.setAttribute('viewBox', '0 0 20 20');
    s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', d);
    s.append(p);
    return s;
  };
  const ICON = {
    comment: 'M10 2.5c-4.4 0-8 2.9-8 6.6 0 1.9 1 3.6 2.6 4.8l-.8 3.1 3.6-1.8c.8.2 1.7.3 2.6.3 4.4 0 8-2.9 8-6.5S14.4 2.5 10 2.5Z',
    share: 'M12 3l5 5-5 5V9.7c-4 0-6.5 1.2-8.5 4.3.6-4.6 3-7.6 8.5-8.3V3Z',
    save: 'M5 2.5h10v15l-5-3.6-5 3.6v-15Z',
    more: 'M4 10a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Zm4.5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Zm4.5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z',
    search: 'M8.5 3a5.5 5.5 0 1 0 3.4 9.8l3.7 3.7 1.1-1.1-3.7-3.7A5.5 5.5 0 0 0 8.5 3Zm0 1.6a3.9 3.9 0 1 1 0 7.8 3.9 3.9 0 0 1 0-7.8Z',
    mail: 'M2.5 4.5h15v11h-15v-11Zm1.6 1.6v.3L10 10.6l5.9-4.2v-.3H4.1Zm11.8 2.3L10 12.6 4.1 8.4v5.5h11.8V8.4Z',
    plus: 'M9.2 3h1.6v6.2H17v1.6h-6.2V17H9.2v-6.2H3V9.2h6.2V3Z',
    play: 'M7 5l8 5-8 5V5Z',
  };

  // A colored letter in place of the subreddit icon (old Reddit's listing has no icons).
  const hue = name => [...name.toLowerCase()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  const avatar = name => {
    const a = el('span', 'rr-avatar', name.charAt(0).toUpperCase());
    a.style.setProperty('--h', hue(name));
    return a;
  };

  const IMAGE = /\.(jpe?g|png|gif|webp|svg)(\?|$)/i;

  const buildAppBar = () => {
    const header = document.getElementById('header');
    if (!header || document.getElementById('rr-bar')) return;
    const path = location.pathname;
    const bar = el('nav', '');
    bar.id = 'rr-bar';
    bar.setAttribute('aria-label', 'Feeds');

    const top = el('div', 'rr-bar-top');
    const logo = el('a', 'rr-logo');
    logo.href = '/hot';
    logo.setAttribute('aria-label', 'Reddit front page, Hot');
    logo.append(el('span', 'rr-logo-mark'), el('span', 'rr-logo-word', 'reddit'));
    top.append(logo);

    const feeds = el('div', 'rr-feeds');
    for (const [label, href, re] of [['Home', '/hot', /^\/((hot|new|rising|top|controversial|best)\/?)?$/], ['Popular', '/r/popular/', /^\/r\/popular/i], ['All', '/r/all/', /^\/r\/all/i]]) {
      const a = el('a', 'rr-chip', label);
      a.href = href;
      if (re.test(path)) a.setAttribute('aria-current', 'page');
      feeds.append(a);
    }
    top.append(feeds);

    const actions = el('div', 'rr-actions');
    const search = el('a', 'rr-icon');
    search.href = 'https://www.reddit.com/search/';
    search.setAttribute('aria-label', 'Search');
    search.append(icon(ICON.search));
    const create = el('a', 'rr-icon rr-desktop');
    create.href = '/submit';
    create.setAttribute('aria-label', 'Create post');
    create.append(icon(ICON.plus));
    const mailSrc = document.getElementById('mail');
    const mail = el('a', 'rr-icon');
    mail.href = mailSrc ? mailSrc.href : '/message/inbox/';
    mail.setAttribute('aria-label', 'Messages');
    if (mailSrc && mailSrc.classList.contains('havemail')) mail.classList.add('rr-dot');
    mail.append(icon(ICON.mail));
    actions.append(search, create, mail);
    const user = header.querySelector('#header-bottom-right .user a');
    if (user) {
      const me = el('a', 'rr-me');
      me.href = user.href;
      me.setAttribute('aria-label', `Profile: ${user.textContent}`);
      me.append(avatar(user.textContent));
      actions.append(me);
    }
    top.append(actions);
    bar.append(top);

    // The sort tabs, as a row of pills (Reddit's own links, moved).
    const tabs = header.querySelector('.tabmenu');
    if (tabs) {
      const sorts = el('div', 'rr-sorts');
      for (const li of tabs.querySelectorAll('li')) {
        const a = li.querySelector('a');
        if (!a || /\/(wiki|gilded)\/?$/.test(a.pathname)) continue;
        const pill = el('a', 'rr-chip', a.textContent.replace(/^./, c => c.toUpperCase()));
        pill.href = a.href;
        if (li.classList.contains('selected')) pill.setAttribute('aria-current', 'page');
        sorts.append(pill);
      }
      bar.append(sorts);
    }
    header.before(bar);
  };

  // Desktop: a left rail with the feeds, custom feeds and subscriptions.
  const buildRail = () => {
    if (document.getElementById('rr-rail')) return;
    const rail = el('aside', '');
    rail.id = 'rr-rail';
    const section = (title, links) => {
      if (!links.length) return;
      rail.append(el('h2', 'rr-rail-title', title));
      for (const [text, href] of links) {
        const a = el('a', 'rr-rail-link');
        a.href = href;
        a.append(avatar(text.replace(/^r\//, '')), el('span', '', text));
        rail.append(a);
      }
    };
    section('Feeds', [['Home', '/hot'], ['Popular', '/r/popular/'], ['All', '/r/all/']]);
    section('Custom feeds', [...document.querySelectorAll('.side a[href*="/m/"]')].map(a => [a.textContent, a.href]));
    section('Communities', [...document.querySelectorAll('#sr-bar a')].map(a => [`r/${a.textContent}`, a.href]));
    document.body.prepend(rail);
  };

  const pill = (cls, child) => {
    const p = el('span', `rr-pill ${cls}`);
    p.append(child);
    return p;
  };

  const restylePost = thing => {
    if (thing.dataset.rr) return;
    const entry = thing.querySelector(':scope > .entry');
    const tagline = entry && entry.querySelector('.tagline');
    const buttons = entry && entry.querySelector('.flat-list.buttons');
    if (!entry || !tagline || !buttons) return; // not a post, or not rendered yet
    thing.dataset.rr = '1';

    // Header row: subreddit, age.
    const head = el('div', 'rr-head');
    const sub = tagline.querySelector('a.subreddit');
    const subName = thing.dataset.subreddit || (sub && sub.textContent.replace(/^r\//, '')) || '';
    if (sub) {
      const s = sub.cloneNode(false);
      s.className = 'rr-sub';
      s.append(avatar(subName), el('span', '', `r/${subName}`));
      head.append(s);
    }
    const time = tagline.querySelector('time');
    if (time) head.append(el('span', 'rr-dot-sep', '•'), el('span', 'rr-age', time.textContent.replace(/ ago$/, '').replace(/ (\w)\w*s?$/, '$1').replace(/^an? /, '1')));
    const author = tagline.querySelector('a.author');
    if (author) {
      const a = author.cloneNode(false);
      a.className = 'rr-author';
      a.textContent = `u/${author.textContent}`;
      head.append(el('span', 'rr-dot-sep rr-desktop', '•'), a);
    }
    entry.prepend(head);

    // Media: show images in full instead of the 70px thumbnail.
    const url = thing.dataset.url || '';
    const domain = thing.dataset.domain || '';
    if (IMAGE.test(url) || /^(i\.redd\.it|i\.imgur\.com)$/.test(domain) && IMAGE.test(url)) {
      const link = el('a', 'rr-media');
      link.href = entry.querySelector('a.title')?.href || url;
      const img = el('img');
      img.src = url;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      link.append(img);
      entry.querySelector('.top-matter').after(link);
      thing.classList.add('rr-has-media');
    } else if (domain === 'v.redd.it') {
      thing.querySelector(':scope > .thumbnail')?.append(pill('rr-play', icon(ICON.play)));
    }

    // Action row: Reddit's vote arrows and score, then comments, share, save, more.
    const row = el('div', 'rr-actions-row');
    const mid = thing.querySelector(':scope > .midcol');
    if (mid) row.append(mid); // moved, not copied: its arrows keep their click handlers
    const comments = buttons.querySelector('a.comments');
    if (comments) {
      const n = (comments.textContent.match(/[\d,.]+k?/) || ['0'])[0];
      comments.dataset.count = n;
      comments.textContent = '';
      comments.append(icon(ICON.comment), el('span', '', n));
      comments.setAttribute('aria-label', `${n} comments`);
      row.append(pill('rr-comments', comments));
    }
    const share = buttons.querySelector('.share a');
    if (share) {
      share.textContent = '';
      share.append(icon(ICON.share), el('span', 'rr-label', 'Share'));
      row.append(pill('', share));
    }
    const save = buttons.querySelector('.save-button a');
    if (save) {
      save.prepend(icon(ICON.save));
      row.append(pill('rr-save', save));
    }
    const more = el('button', 'rr-pill rr-more');
    more.type = 'button';
    more.setAttribute('aria-label', 'More: hide, report, crosspost');
    more.setAttribute('aria-expanded', 'false');
    more.append(icon(ICON.more));
    row.append(more);
    buttons.classList.add('rr-menu'); // what's left (hide, report, crosspost) is the menu
    // Full width under the post, beside nothing (the thumbnail sits next to the title only).
    thing.querySelector(':scope > .clearleft')?.before(row, buttons);
  };

  // One listener for every "more" button.
  document.addEventListener('click', e => {
    const more = e.target.closest?.('.rr-more');
    if (!more) return;
    const open = more.getAttribute('aria-expanded') !== 'true';
    more.setAttribute('aria-expanded', String(open));
    more.closest('.thing').classList.toggle('rr-menu-open', open);
  });

  const restyleAll = () => document.querySelectorAll('#siteTable > .thing.link').forEach(restylePost);

  setViewport();
  const start = () => {
    buildAppBar();
    buildRail();
    restyleAll();
    // Later pages (RES's never-ending scroll) add posts to #siteTable.
    const table = document.getElementById('siteTable');
    if (table) new MutationObserver(restyleAll).observe(table, { childList: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
