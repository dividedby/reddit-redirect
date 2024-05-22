// ==UserScript==
// @name        New Reddit Hot Redirect
// @namespace   https://greasyfork.org/en/users/594496-divided-by
// @author      dividedby
// @description Redirects default frontpage from 'best' to 'hot' and entire site to new.reddit.com
// @version     1.1
// @license     GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @contributionURL     https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=dividedbyerror@gmail.com&item_name=Reddit+Redirect+Donation
// @contributionAmount  $1
// @include     /^https:\/\/[a-z0-9.]*\.?reddit.com/
// @run-at      document-start
// @downloadURL https://update.greasyfork.org/scripts/495315/New%20Reddit%20Hot%20Redirect.user.js
// @updateURL   https://update.greasyfork.org/scripts/495315/New%20Reddit%20Hot%20Redirect.user.js
// ==/UserScript==

(function () {
  const currentUrl = window.location.href;

  if (currentUrl.startsWith("https://www.reddit.com/")) {
    // Redirect specific posts or subreddits to the new domain
    const newUrl = currentUrl.replace(
      "https://www.reddit.com",
      "https://new.reddit.com"
    );
    window.location.replace(newUrl);
  } else if (currentUrl.match(/^https?:\/\/[a-z0-9.]*reddit\.com\/?$/i)) {
    // Redirect the frontpage to the hot section
    window.location.replace(currentUrl + "hot");
  }
})();
