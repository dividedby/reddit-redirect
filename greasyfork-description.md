Reddit's feeds open in **old Reddit**, with the front page on **Hot** instead of Reddit's
default **Best**, and the Reddit logo takes you to Hot too. Posts and subreddits open in
Reddit's new design, with subreddits on **Hot**.

**New in 2.5**

- **If old Reddit turns you away, feeds still show in the old design**, on `www.reddit.com`,
  and the front page goes to `www.reddit.com/hot`. Posts and subreddits stay on the new design.
  This uses an undocumented cookie Reddit honors, so it could stop working. If it does, feeds
  stay on the new design and the front page goes to your custom feed, as before.

**New in 2.4**

- **Posts, subreddits and profiles now really open in the new design.** Visiting old Reddit
  sets a cookie that puts all of `www.reddit.com` in the old design, so after your first feed
  they were showing the old design too. The script now removes it on old Reddit. If you've
  been seeing the old design on those pages, this is a visible change.
- Reddit's server sends `www.reddit.com/r/a+b/` and `www.reddit.com/r/all` to the front page
  before any script runs, so those land on old Reddit's Hot. Links and bookmarks on
  `old.reddit.com` itself work.

**New in 2.3**

- **Opening `reddit.com` again soon after going to old Reddit no longer pauses it for a day.**
  That only happens now if old Reddit didn't show you a listing first. To tell the two
  apart, old Reddit sets a cookie holding the time (`rhr_old_seen`) that lasts a minute.

**New in 2.2**

- **Only the feeds open in old Reddit**: the front page (on Hot), `r/all`, `r/popular`,
  combined subreddits (`r/a+b`), custom feeds, and old Reddit's `r/friends`, `r/mod` and
  `r/random`. The new design has removed `r/all` and
  has no Hot front page, but it shows posts and subreddits fine, so posts, subreddits,
  profiles and search now stay there.
- **Subreddits open on Hot** (`/r/<name>/hot/`): the new design starts every visit on Best.
- On old Reddit, links to posts, subreddits and profiles open in the new design, including
  Ctrl/Cmd-click, middle-click and "Open in New Tab".

**New in 2.1**

- **Every Reddit page opens in old Reddit**: posts, subreddits, profiles, search. A few
  pages only the new design has stay there (settings, chat, notifications, the image
  viewer, mod tools, share links).
- Bare `old.reddit.com` (where old Reddit's logo goes) opens on Hot too, instead of Best.

**New in 2.0**

Reddit's new design dropped the Hot front page (only Best and New are left), so:

- The front page and the logo now take you to **old Reddit's Hot** (`old.reddit.com/hot`).
  Old Reddit needs you to be logged in.
- **If old Reddit turns you away** (Reddit is limiting it to people who have used it in the
  last six months), pages stay on the new design and the front page goes to your **custom
  feed sorted by Hot**: the custom feed you last opened. Old Reddit is tried again after a
  day. With no custom feed, the front page is left as Reddit shows it.

**How it works**

- Redirects happen before the page draws, and Back still works: the redirect replaces the
  page in your history.
- Ctrl/Cmd-click and middle-click on the logo are left to your browser.
- In the Userscripts app (Safari), allow the script on both `www.reddit.com` and
  `old.reddit.com`.

Source, changelog and issues: [GitHub](https://github.com/dividedby/reddit-redirect)

Find it useful? You can [send a tip via PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=dividedbygit@gmail.com&item_name=Reddit+Hot+Donation). Thank you!
