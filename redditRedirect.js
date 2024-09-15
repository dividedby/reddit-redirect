// ==UserScript==
// @name        Reddit Hot Redirect with Logo Click Handler
// @author      dividedby
// @description Redirects default frontpage from 'best' to 'hot' and handles logo clicks
// @version     1.1
// @license     GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @contributionURL     https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=dividedbyerror@gmail.com&item_name=Reddit+Hot+Donation
// @contributionAmount  $1
// @match       https://www.reddit.com/*
// @run-at      document-start
// @namespace   https://greasyfork.org/users/162192

// @downloadURL https://update.greasyfork.org/scripts/508344/Reddit%20Hot%20Redirect%20with%20Logo%20Click%20Handler.user.js
// @updateURL https://update.greasyfork.org/scripts/508344/Reddit%20Hot%20Redirect%20with%20Logo%20Click%20Handler.meta.js
// ==/UserScript==

(function() {
    'use strict';

    if (location.pathname === '/') {
        location.replace('https://www.reddit.com/hot');
    }

    const observer = new MutationObserver(() => {
        const logo = document.querySelector('a[aria-label="Home"]');
        if (logo && !logo.dataset.hotRedirect) {
            logo.dataset.hotRedirect = true;
            logo.addEventListener('click', e => {
                e.preventDefault();
                location.href = 'https://www.reddit.com/hot';
            });
            observer.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
