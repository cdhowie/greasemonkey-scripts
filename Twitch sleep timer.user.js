// ==UserScript==
// @name         Twitch sleep timer
// @namespace    https://www.chrishowie.com/
// @version      0.1
// @description  Pause Twitch streams after some amount of time
// @author       Chris Howie
// @match        https://www.twitch.tv/*
// @icon         https://www.google.com/s2/favicons?domain=twitch.tv
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function listen(ele, event, fn) {
        ele.addEventListener(event, fn);
        return () => {
            ele.removeEventListener(event, fn);
        };
    }

    function deepAssign(obj, data) {
        if (data) {
            for (const key of Object.keys(data)) {
                const v = data[key];
                if ('object' === typeof v && v !== null) {
                    if (obj[key] === undefined) {
                        obj[key] = {};
                    }
                    deepAssign(obj[key], v);
                } else {
                    obj[key] = v;
                }
            }
        }
    }

    function element(name, data) {
        const e = document.createElement(name);
        deepAssign(e, data);
        return e;
    }

    function empty(e) {
        while (e.lastChild) {
            e.removeChild(e.lastChild);
        }
    }

    const configUi = element('div', {
        className: 'sleep-timer-config',
        style: { padding: '0.5rem' },
    });

    const configIdle = element('div');
    configUi.appendChild(configIdle);
    configIdle.appendChild(document.createTextNode('Sleep timer: '));

    const configTimeContainer = element('span', { style: { float: 'right' } });

    configIdle.appendChild(configTimeContainer);

    const configActive = element('div');
    configUi.appendChild(configActive);
    configActive.appendChild(document.createTextNode('Sleep in '));

    const configActiveTimer = element('span');
    configActive.appendChild(configActiveTimer);
    configActive.appendChild(document.createTextNode(' '));

    const configActiveStop = element('button', {
        type: 'button',
        style: {
            padding: '0.5rem',
            background: '#800',
            color: '#fff',
            float: 'right',
            fontSize: '75%',
        }
    });
    configActiveStop.appendChild(document.createTextNode('Stop'));
    configActive.appendChild(configActiveStop);

    configUi.appendChild(element('div', { style: { clear: 'both' } }));

    function leftPad(str, chr, len) {
        str = `${str}`;

        while (str.length < len) {
            str = `${chr}${str}`;
        }

        return str;
    }

    function formatDuration(totalSeconds) {
        const sec = totalSeconds % 60;
        const min = Math.floor(totalSeconds / 60) % 60;
        const hr = Math.floor(totalSeconds / (60 * 60));

        return `${hr}:${leftPad(min, '0', 2)}:${leftPad(sec, '0', 2)}`;
    }

    const storageKey = 'sleep-timer-state';

    function getState() {
        return JSON.parse(localStorage.getItem(storageKey) || '{}');
    }

    function applyState(state) {
        if (state.stopAt) {
            configActive.style.display = '';
            configIdle.style.display = 'none';

            const msLeft = Math.max(0, state.stopAt - Date.now());
            empty(configActiveTimer);
            configActiveTimer.appendChild(document.createTextNode(formatDuration(Math.floor(msLeft / 1000))));

            if (msLeft === 0) {
                Array.from(document.getElementsByTagName('video')).forEach(e => { e.pause(); });
            }
        } else {
            configActive.style.display = 'none';
            configIdle.style.display = '';
        }
    }

    function setState(state) {
        localStorage.setItem(storageKey, JSON.stringify(state));
        applyState(state);
    }

    setInterval(() => { applyState(getState()); }, 1000);

    listen(configActiveStop, 'click', event => {
        const state = getState();
        delete state.stopAt;
        setState(state);

        event.stopPropagation();
    });

    function makeOption(label, value) {
        const option = element('option', { value });
        option.appendChild(document.createTextNode(label));
        return option;
    }

    function updateTimeSelector() {
        empty(configTimeContainer);

        const configTime = element('select', { style: { float: 'right' } });
        configTime.appendChild(makeOption("None", 0));

        let startDate = new Date();
        let min = startDate.getMinutes();
        startDate.setMinutes(min - (min % 15) + 15, 0, 0);

        for (let i = 0; i < 4 * 12; i += 1) {
            configTime.appendChild(makeOption(
                startDate.toLocaleTimeString(undefined, { timeStyle: "short" }),
                startDate.getTime()
            ));

            startDate.setMinutes(startDate.getMinutes() + 15);
        }

        listen(configTime, 'change', () => {
            if (configTime.value !== 0) {
                const state = getState();
                state.stopAt = configTime.value;

                setState(state);
            }
        });

        configTimeContainer.appendChild(configTime);
    }

    const observer = new MutationObserver(() => {
        if (document.querySelector('.' + configUi.className) === null) {
            const online = document.querySelector('[data-test-selector="user-menu-dropdown__avatar"]');
            if (online !== null) {
                updateTimeSelector();
                const ipoint = online.parentNode.parentNode.parentNode.parentNode.parentNode;
                ipoint.appendChild(configUi);
            }
        }
    });

    observer.observe(document.body, { subtree: true, childList: true });
})();
