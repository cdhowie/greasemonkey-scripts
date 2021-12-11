// ==UserScript==
// @name         Audio device selector
// @namespace    https://chrishowie.com/
// @version      0.1
// @description  Switch audio devices per tab
// @author       Chris Howie
// @include      *
// @grant        none
// ==/UserScript==

// Adapted to a Tampermonkey script from https://github.com/chuang861012/audioff/blob/master/content.js

(function() {
    'use strict';

    async function selectAudioDevice() {
        const e = document.querySelectorAll('audio,video');

        if (!e || e.length === 0) {
            alert('No media elements on this page.');
            return;
        }

        if (!e[0].setSinkId) {
            // Check for Firefox, because the user must enable a configuration toggle.
            if (/ Firefox\//.test(navigator.userAgent)) {
                alert('setSinkId() is not enabled in Firefox config. Please go to about:config and enable the media.setsinkid.enabled preference, then reload this page.');
            } else {
                alert('setSinkId() is either disabled or not supported by your browser.');
            }
            return;
        }

        try {
            const { deviceId } = await navigator.mediaDevices.selectAudioOutput();
            e.forEach(i => { i.setSinkId(deviceId); });
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                // The user blocked the request, so just ignore it.
            } else if (err.name === 'InvalidStateError') {
                // The user hasn't interacted with the page yet so selectAudioOutput() is forbidden.
                alert('Firefox requires that you interact with the page before an audio output device can be selected. Please click the page and try again.');
            } else {
                console.error(err);
                alert(`Unable to set audio output device: ${err.message} (${err.name})`);
            }
        }
    }

    document.addEventListener('keydown', e => {
        if (!e.ctrlKey && !e.shiftKey && e.altKey && !e.metaKey && e.key === ';') {
            selectAudioDevice();
        }
    }, true);
})();
