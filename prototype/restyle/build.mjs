// Builds fixture.html: an old.reddit.com front page (/hot, logged in) with old Reddit's real
// markup and stylesheet (compiled from reddit-archive), and local placeholder images.
import { writeFile, mkdir } from 'node:fs/promises';

const dir = new URL('.', import.meta.url).pathname;
await mkdir(dir + 'img', { recursive: true });

// Placeholder "photos": gradients with simple shapes, at a real photo's aspect ratio.
const photo = (name, w, h, a, b, shape) => writeFile(`${dir}img/${name}.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>${shape(w, h)}</svg>`);
const hills = (w, h) => `<circle cx="${w * 0.75}" cy="${h * 0.3}" r="${h * 0.09}" fill="#ffe9a8"/>
  <path d="M0 ${h * 0.75} Q ${w * 0.25} ${h * 0.5} ${w * 0.5} ${h * 0.72} T ${w} ${h * 0.62} V ${h} H 0Z" fill="#2f5d3a"/>
  <path d="M0 ${h * 0.85} Q ${w * 0.4} ${h * 0.7} ${w} ${h * 0.88} V ${h} H 0Z" fill="#1e3f27"/>`;
const cat = (w, h) => `<ellipse cx="${w / 2}" cy="${h * 0.66}" rx="${w * 0.22}" ry="${h * 0.2}" fill="#3b3b3b"/>
  <circle cx="${w / 2}" cy="${h * 0.38}" r="${w * 0.14}" fill="#3b3b3b"/>
  <path d="M${w * 0.38} ${h * 0.3} L${w * 0.4} ${h * 0.14} L${w * 0.46} ${h * 0.27}Z M${w * 0.62} ${h * 0.3} L${w * 0.6} ${h * 0.14} L${w * 0.54} ${h * 0.27}Z" fill="#3b3b3b"/>
  <circle cx="${w * 0.45}" cy="${h * 0.37}" r="${w * 0.018}" fill="#c8f56a"/><circle cx="${w * 0.55}" cy="${h * 0.37}" r="${w * 0.018}" fill="#c8f56a"/>`;
const chart = (w, h) => [0.2, 0.45, 0.35, 0.7, 0.55, 0.85].map((v, i) =>
  `<rect x="${w * (0.12 + i * 0.13)}" y="${h * (0.9 - v * 0.75)}" width="${w * 0.09}" height="${h * v * 0.75}" rx="6" fill="#fff" opacity=".85"/>`).join('');
const news = (w, h) => `<rect x="${w * 0.1}" y="${h * 0.15}" width="${w * 0.8}" height="${h * 0.7}" rx="8" fill="#fff" opacity=".9"/>
  <rect x="${w * 0.16}" y="${h * 0.25}" width="${w * 0.5}" height="${h * 0.08}" fill="#333"/>
  <rect x="${w * 0.16}" y="${h * 0.42}" width="${w * 0.68}" height="${h * 0.05}" fill="#999"/><rect x="${w * 0.16}" y="${h * 0.54}" width="${w * 0.6}" height="${h * 0.05}" fill="#999"/>`;
const game = (w, h) => `<rect x="${w * 0.2}" y="${h * 0.35}" width="${w * 0.6}" height="${h * 0.32}" rx="${h * 0.16}" fill="#222"/>
  <circle cx="${w * 0.35}" cy="${h * 0.51}" r="${h * 0.06}" fill="#888"/><circle cx="${w * 0.66}" cy="${h * 0.47}" r="${h * 0.035}" fill="#e33"/><circle cx="${w * 0.72}" cy="${h * 0.55}" r="${h * 0.035}" fill="#3a3"/>`;
await photo('landscape', 1600, 1067, '#7fb6e6', '#cfe6f5', hills);
await photo('cat', 1080, 1350, '#e9d8c4', '#cdb79e', cat);
await photo('chart', 1200, 800, '#3d5a80', '#98c1d9', chart);
await photo('news', 600, 400, '#c9ccd1', '#9aa0a8', news);
await photo('game', 640, 360, '#5b3fa0', '#2c1f52', game);

const posts = [
  { id: 'a1', sub: 'pics', title: 'Woke up early and caught the fog rolling out of the valley', domain: 'i.redd.it', url: 'img/landscape.svg', thumb: 'img/landscape.svg', score: '24.1k', comments: 412, age: '5 hours ago', short: '5h', author: 'fogchaser', flair: 'OC' },
  { id: 'a2', sub: 'worldnews', title: 'City council approves plan to turn downtown parking garages into housing', domain: 'apnews.com', url: 'https://apnews.com/article/x', thumb: 'img/news.svg', score: '18.7k', comments: 2318, age: '3 hours ago', short: '3h', author: 'newsbot_9' },
  { id: 'a3', sub: 'AskReddit', title: 'What is a small habit that genuinely improved your life?', domain: 'self.AskReddit', url: '/r/AskReddit/comments/a3/x/', thumb: null, self: true, score: '9.8k', comments: 6120, age: '6 hours ago', short: '6h', author: 'curious_k' },
  { id: 'a4', sub: 'cats', title: 'He has decided this box is his now', domain: 'i.redd.it', url: 'img/cat.svg', thumb: 'img/cat.svg', score: '7.2k', comments: 98, age: '2 hours ago', short: '2h', author: 'meowmix' },
  { id: 'a5', sub: 'Games', title: 'Trailer: the sequel nobody expected gets a release date', domain: 'v.redd.it', url: '/r/Games/comments/a5/x/', thumb: 'img/game.svg', video: true, score: '5.4k', comments: 870, age: '4 hours ago', short: '4h', author: 'pixelpusher', flair: 'Trailer' },
  { id: 'a6', sub: 'dataisbeautiful', title: 'How long people actually keep their phones, by country [OC]', domain: 'i.redd.it', url: 'img/chart.svg', thumb: 'img/chart.svg', score: '3.9k', comments: 301, age: '7 hours ago', short: '7h', author: 'plotter', flair: 'OC' },
];

const thing = (p, i) => `
<div class=" thing id-t3_${p.id} ${i % 2 ? 'even' : 'odd'} link ${p.self ? 'self' : ''}" data-subreddit="${p.sub}" data-subreddit-prefixed="r/${p.sub}" data-author="${p.author}" data-domain="${p.domain}" data-url="${p.url}" data-comments-count="${p.comments}" data-rank="${i + 1}" data-type="link" data-fullname="t3_${p.id}" data-permalink="/r/${p.sub}/comments/${p.id}/x/" id="thing_t3_${p.id}" onclick="click_thing(this)">
  <p class="parent"></p><span class="rank">${i + 1}</span>
  <div class="midcol unvoted"><div class="arrow up login-required access-required" data-event-action="upvote" role="button" aria-label="upvote" tabindex="0"></div><div class="score dislikes" title="${p.score}">${p.score}</div><div class="score unvoted" title="${p.score}">${p.score}</div><div class="score likes" title="${p.score}">${p.score}</div><div class="arrow down login-required access-required" data-event-action="downvote" role="button" aria-label="downvote" tabindex="0"></div></div>
  ${p.thumb ? `<a class="thumbnail invisible-when-pinned may-blank outbound" href="${p.url}"><img src="${p.thumb}" width="70" height="52" alt=""></a>` : `<a class="thumbnail invisible-when-pinned self may-blank" href="${p.url}"></a>`}
  <div class="entry unvoted"><div class="top-matter">
    <p class="title"><a class="title may-blank outbound" data-event-action="title" href="${p.url}" tabindex="1">${p.title}</a>${p.flair ? ` <span class="linkflairlabel " title="${p.flair}">${p.flair}</span>` : ''} <span class="domain">(<a href="/domain/${p.domain}/">${p.domain}</a>)</span></p>
    ${p.self ? '<div class="expando-button collapsed hide-when-pinned selftext"></div>' : p.video ? '<div class="expando-button collapsed hide-when-pinned video"></div>' : '<div class="expando-button collapsed hide-when-pinned image"></div>'}
    <p class="tagline ">submitted&#32;<time title="Sat Oct 24 2026" datetime="2026-10-24T12:00:00+00:00" class="live-timestamp">${p.age}</time>&#32;by&#32;<a href="https://old.reddit.com/user/${p.author}" class="author may-blank id-t2_x">${p.author}</a><span class="userattrs"></span>&#32;to&#32;<a href="https://old.reddit.com/r/${p.sub}/" class="subreddit hover may-blank">r/${p.sub}</a></p>
    <ul class="flat-list buttons"><li class="first"><a href="https://old.reddit.com/r/${p.sub}/comments/${p.id}/x/" data-event-action="comments" class="bylink comments may-blank" rel="nofollow">${p.comments.toLocaleString('en-US')} comments</a></li><li class="share"><a class="post-sharing-button" href="javascript: void 0;">share</a></li><li class="link-save-button save-button login-required"><a href="#">save</a></li><li><form action="/post/hide" method="post" class="state-button hide-button"><input type="hidden" name="executed" value="hidden"><span><a href="javascript:void(0)" data-event-action="hide">hide</a></span></form></li><li class="report-button login-required"><a href="javascript:void(0)" class="reportbtn access-required" data-event-action="report">report</a></li><li class="crosspost-button"><a class="post-crosspost-button" href="javascript: void 0;" data-crosspost-fullname="t3_${p.id}">crosspost</a></li></ul>
    <div class="reportform report-t3_${p.id}"></div></div>
  <div class="expando expando-uninitialized" style="display: none"><span class="error">loading...</span></div></div>
  <div class="child"></div><div class="clearleft"></div>
</div><div class="clearleft"></div>`;

const html = `<!doctype html>
<html lang="en" xml:lang="en"><head>
<title>reddit: the front page of the internet</title>
<meta name="viewport" content="width=1024">
<link rel="stylesheet" href="vendor/reddit.css">
</head>
<body class="listing-page hot-page front-page loggedin">
<div id="header" role="banner"><a tabindex="1" href="#content" id="jumpToContent">jump to content</a>
<div id="sr-header-area"><div class="width-clip"><div class="dropdown srdrop"><span class="selected title">my subreddits</span></div><div class="sr-list"><ul class="flat-list sr-bar hover"><li class="selected"><a href="https://old.reddit.com/" class="choice">front</a></li><li><span class="separator">-</span><a href="https://old.reddit.com/r/popular/" class="choice">popular</a></li><li><span class="separator">-</span><a href="https://old.reddit.com/r/all/" class="choice">all</a></li><li><span class="separator">-</span><a href="https://old.reddit.com/users/" class="choice">users</a></li></ul><span class="separator">&nbsp;|&nbsp;</span><ul class="flat-list sr-bar hover" id="sr-bar">${['AskReddit', 'pics', 'worldnews', 'cats', 'Games', 'dataisbeautiful', 'science', 'todayilearned', 'movies', 'books'].map((s, i) => `<li>${i ? '<span class="separator">-</span>' : ''}<a href="https://old.reddit.com/r/${s}/" class="choice">${s}</a></li>`).join('')}</ul></div><a href="https://old.reddit.com/subreddits/" id="sr-more-link">more &raquo;</a></div></div>
<div id="header-bottom-left"><a href="/" id="header-img" class="default-header" title="">reddit.com</a>&nbsp;<ul class="tabmenu "><li class="selected"><a href="https://old.reddit.com/hot/" class="choice">hot</a></li><li><a href="https://old.reddit.com/new/" class="choice">new</a></li><li><a href="https://old.reddit.com/rising/" class="choice">rising</a></li><li><a href="https://old.reddit.com/controversial/" class="choice">controversial</a></li><li><a href="https://old.reddit.com/top/" class="choice">top</a></li><li><a href="https://old.reddit.com/gilded/" class="choice">gilded</a></li><li><a href="https://old.reddit.com/wiki/" class="choice">wiki</a></li></ul></div>
<div id="header-bottom-right"><span class="user"><a href="https://old.reddit.com/user/dividedby/">dividedby</a>&nbsp;(<span class="userkarma" title="post karma">1,234</span>)</span><span class="separator">|</span><a title="new mail!" href="https://old.reddit.com/message/unread/" class="havemail" id="mail">messages</a><span class="separator">|</span><ul class="flat-list hover"><li><a href="https://old.reddit.com/prefs/" class="pref-lang choice">preferences</a></li></ul><span class="separator">|</span><form method="post" action="/logout" class="logout hover"><input type="hidden" name="uh" value=""><a href="javascript:void(0)">logout</a></form></div>
</div>
<div class="side"><div class="spacer"><form action="https://old.reddit.com/search" id="search" role="search"><input type="text" name="q" placeholder="search" tabindex="20"><input type="submit" value="" tabindex="22"></form></div>
<div class="spacer"><div class="sidebox submit submit-link"><div class="morelink"><a href="https://old.reddit.com/submit" class="login-required access-required" target="_top">Submit a new link</a><div class="nub"></div></div></div></div>
<div class="spacer"><div class="sidebox submit submit-text"><div class="morelink"><a href="https://old.reddit.com/submit?selftext=true" class="login-required access-required" target="_top">Submit a new text post</a><div class="nub"></div></div></div></div>
<div class="spacer"><div class="sidecontentbox"><div class="title"><h1>MULTIREDDITS</h1></div><ul class="content"><li><a href="https://old.reddit.com/user/dividedby/m/news/">news</a></li><li><a href="https://old.reddit.com/user/dividedby/m/gaming/">gaming</a></li></ul></div></div>
</div>
<a name="content"></a>
<div class="content" role="main"><div class="spacer"><div id="siteTable" class="sitetable linklisting">
${posts.map(thing).join('\n')}
<div class="nav-buttons"><span class="nextprev">view more:&nbsp;<span class="next-button"><a href="https://old.reddit.com/?count=25&amp;after=t3_a6" rel="nofollow next">next &rsaquo;</a></span></span></div>
</div></div></div>
<div class="footer-parent"><div class="footer rounded"><div class="col"><ul class="flat-vert hover"><li class="flat-vert title">about</li><li><a href="https://www.redditinc.com/blog" class="choice">blog</a></li></ul></div></div><p class="bottommenu">Use of this site constitutes acceptance of our User Agreement and Privacy Policy. &copy; 2026 reddit inc. All rights reserved.</p></div>
<script>function click_thing() {}</script>
</body></html>`;
await writeFile(dir + 'fixture.html', html);
console.log('ok');
