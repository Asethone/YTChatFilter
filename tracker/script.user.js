// ==UserScript==
// @name        YouTube live chat message tracker
// @namespace   https://github.com/Asethone/YTChatFilter/tree/main/
// @version     1.0.0
// @description This script tracks new messages in live chat, scraps them and sends to local HTTP server at http://localhost:3000
// @author      asethone
// @match       https://www.youtube.com/live_chat*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @updateURL   https://github.com/Asethone/YTChatFilter/raw/main/tracker/script.user.js
// @downloadURL https://github.com/Asethone/YTChatFilter/raw/main/tracker/script.user.js
// @grant       GM_xmlhttpRequest
// @connect     localhost
// ==/UserScript==

(function () {
    'use strict'

    console.log('RUNNING script.user.js...');
    // Data
    let isActive = false;           // is message tracking active
    const serverURL = 'http://localhost:3000';
    // Button colors
    const statusColor = { false: '#3e3e3e', true: '#ea3322' };
    // Append button to header
    let chatHeader = document.querySelector("yt-live-chat-header-renderer");
    let button = document.createElement('button');
    button.style.padding = '10px';
    button.style.marginRight = '5px';
    button.style.borderRadius = '10px';
    button.style.backgroundColor = statusColor[isActive];
    button.style.border = 'none';
    chatHeader.insertBefore(button, document.querySelector("#live-chat-header-context-menu"));
    // callback on message appearing
    const onAppend = function(appendedNode) {
        // if element is not a chat message (may be some youtube alerts, notifications, etc.) do not handle it
        if (appendedNode.tagName != 'YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER')
            return;
        // timeout just in case image src-s are not yet loaded correctly
        setTimeout(() => {
            const data = {};
            // get message text
            data.message = (() => {
                const elMsg = appendedNode.querySelector('#message');
                let strMsg = '';
                for (const node of elMsg.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        strMsg += node.textContent;
                    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'IMG') {
                        let emoji = node.getAttribute('alt');
                        if (emoji)
                            strMsg += emoji;
                    }
                }
                return strMsg;
            })();
            // get author's image and name
            data.imgSrc = appendedNode.querySelector('#img').getAttribute('src');
            data.author = appendedNode.querySelector('#author-name').textContent;
            // send message to server
            GM_xmlhttpRequest({
                method: 'POST',
                url: serverURL,
                headers: {
                    "Content-Type": "application/json"
                },
                data: JSON.stringify(data)
            });
        }, 100);
    };
    // Mutation callback
    const callback = function (mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                onAppend(node);
            }
        }
    };
    // Create observer to watch for new chat messages
    const observer = new MutationObserver(callback);    
    // Toggle status function
    function updateStatus(status) {
        isActive = status;
        button.style.backgroundColor = statusColor[isActive];
        console.log('Tracking status: ' + (isActive ? 'active' : 'non active'));
        if (isActive) {
            const msgList = document.querySelector('#chat #items');
            observer.observe(msgList, { childList: true });
        } else {
            observer.disconnect();
        }
    };
    // Set button onclick handler
    button.onclick = () => {
        updateStatus(!isActive);
    };
    // Disable tracking if chat is opened in new window
    let observerPopup = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (!mutation.target.classList.contains('iron-selected')) {
                updateStatus(false);
            }
        }
    });
    const divChatContainer = document.getElementById('chat-messages');
    observerPopup.observe(divChatContainer, {
        attributeFilter: ["class"]
    });
    // Call updateStatus() if chat filter was changed from YT interface
    const observerChatFilter = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.oldValue !== null) {
                updateStatus(isActive);
            }
        }
    });
    const elChatRenderer = document.querySelector('#contents > yt-live-chat-renderer');
    observerChatFilter.observe(elChatRenderer, {
        attributeFilter: ["loading"],
        attributeOldValue: true
    });
})();
