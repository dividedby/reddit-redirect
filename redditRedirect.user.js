// ==UserScript==
// @name        Reddit Hot Redirect with Logo Click Handler
// @namespace   https://greasyfork.org/en/users/594496-divided-by
// @author      dividedby
// @description Redirects default frontpage from 'best' to 'hot' and handles logo clicks
// @version     1.6
// @license     GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @homepageURL https://github.com/dividedby/reddit-redirect
// @supportURL  https://github.com/dividedby/reddit-redirect/issues
// @contributionURL     https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=dividedbygit@gmail.com&item_name=Reddit+Hot+Donation
// @contributionAmount  $1
// @match       https://www.reddit.com/*
// @run-at      document-start
// @grant       none
// @noframes
// @downloadURL https://update.greasyfork.org/scripts/508344/Reddit%20Hot%20Redirect%20with%20Logo%20Click%20Handler.user.js
// @updateURL https://update.greasyfork.org/scripts/508344/Reddit%20Hot%20Redirect%20with%20Logo%20Click%20Handler.meta.js
// ==/UserScript==

(function() {
    'use strict';

    function redirectToHot() {
        // Automatically redirect only on homepage. replace() so Back skips the
        // '/' entry instead of landing on it and redirecting again.
        if (location.pathname === '/') {
            location.replace('/hot' + location.search);
        }
    }

    redirectToHot();

    // In-app navigation to '/' (pushState) isn't seen by popstate; the Navigation
    // API reports every same-document navigation. Once it lands on '/', replace it
    // with /hot ('/hot' never matches, so no loop).
    if (window.navigation) {
        navigation.addEventListener('navigatesuccess', redirectToHot);
    } else {
        window.addEventListener('popstate', redirectToHot);
    }

    // shortcut: event delegation catches the logo even after SPA re-renders —
    // no MutationObserver, and no document.body (null at document-start) needed.
    document.addEventListener('click', (e) => {
        // Leave modified and non-left clicks (new tab/window) to the browser.
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (e.target.closest('#reddit-logo')) {
            e.preventDefault();
            location.assign('/hot');
        }
    }, true);
})();
