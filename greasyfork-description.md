The Reddit front page opens on **Hot** instead of Reddit's default **Best**, and the Reddit
logo takes you to Hot too.

**New in 2.1**

- On old Reddit, the logo goes to Hot too, instead of the front page's Best.

**New in 2.0**

Reddit's new design dropped the Hot front page (only Best and New are left), so:

- The front page and the logo now take you to **old Reddit's Hot** (`old.reddit.com/hot`).
  Old Reddit needs you to be logged in.
- **If old Reddit turns you away** (Reddit is limiting it to people who have used it in the
  last six months), they go to your **custom feed sorted by Hot** instead: the custom feed
  you last opened. Old Reddit is tried again after a day.
- With neither, the front page is left as Reddit shows it.

**How it works**

- Opening `reddit.com/` (or `/hot`, `/best`) redirects before the page draws. Only the
  front page is redirected; every other page is left alone.
- Back still works: the redirect replaces the front page in your history.
- Ctrl/Cmd-click and middle-click on the logo are left to your browser.

Source, changelog and issues: [GitHub](https://github.com/dividedby/reddit-redirect)

Find it useful? You can [send a tip via PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=dividedbygit@gmail.com&item_name=Reddit+Hot+Donation). Thank you!
