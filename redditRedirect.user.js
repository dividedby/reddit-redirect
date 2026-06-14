// ==UserScript==
// @name        Reddit Hot Redirect with Logo Click Handler
// @namespace   https://greasyfork.org/en/users/594496-divided-by
// @author      dividedby
// @description Redirects default frontpage from 'best' to 'hot' and handles logo clicks
// @version     1.5
// @license     GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @contributionURL     https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=dividedbygit@gmail.com&item_name=Reddit+Hot+Donation
// @contributionAmount  $1
// @match       https://www.reddit.com/*
// @run-at      document-start

// @downloadURL https://update.greasyfork.org/scripts/508344/Reddit%20Hot%20Redirect%20with%20Logo%20Click%20Handler.user.js
// @updateURL https://update.greasyfork.org/scripts/508344/Reddit%20Hot%20Redirect%20with%20Logo%20Click%20Handler.meta.js
// ==/UserScript==

(function() {
    'use strict';

    function redirectToHot() {
        // Automatically redirect only on homepage
        if (window.location.pathname === '/') {
            window.location.href = 'https://www.reddit.com/hot';
        }
    }

    redirectToHot();
    window.addEventListener('popstate', redirectToHot);

    // ponytail: event delegation catches the logo even after SPA re-renders —
    // no MutationObserver, and no document.body (null at document-start) needed.
    document.addEventListener('click', (e) => {
        if (e.target.closest('#reddit-logo')) {
            e.preventDefault();
            window.location.href = 'https://www.reddit.com/hot';
        }
    }, true);
})();
