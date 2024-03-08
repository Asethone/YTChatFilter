// ==UserScript==
// @name        [TRACKER] YouTube live chat filter GD level IDs
// @namespace   https://github.com/Asethone/YTLiveChatView
// @version     1.0.0
// @description Filter chat messages with only GD level identificators. This script is only a filter for the tracker.
// @author      asethone
// @match       https://www.youtube.com/live_chat*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @updateURL   https://github.com/Asethone/YTLiveChatView/raw/main/scripts/filter.user.js
// @downloadURL https://github.com/Asethone/YTLiveChatView/raw/main/scripts/filter.user.js
// @require     https://github.com/Asethone/YTLiveChatView/raw/main/scripts/tracker.user.js
// @grant       GM_xmlhttpRequest
// @connect     localhost
// ==/UserScript==

(function () {
    // TODO: rework to accept delimeters: ',.- '
    'use strict'

    // Set filter function
    filterMessage = function(message) {
        message = message.replaceAll(/(?<!\d{6,9}),(?!\d{6,9})/g, '');
        const ids = message.match(/(?<!\d)\d{6,9}(?!\d)/g);
        if (ids === null)
            return null;
        const contents = [];
        for (const id of ids) {
            contents.push(id);
        }
        return { messages: contents, allowDuplicates: false };
    }
})();
