/**
 * functions.js — the page itself.
 *
 * Choreography, in order:
 *   1. the letter types itself out (skippable — any click, key or focus)
 *   2. the heart blooms rose by rose on the canvas
 *   3. the counter fades in, then the signature
 *
 * Everything here honours prefers-reduced-motion, and every loop parks itself
 * when the tab is hidden.
 */
(function () {
    'use strict';

    const config = window.CONFIG || {};
    const timing = config.timing || {};
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /** The heart curve was tuned against this canvas size; everything scales from it. */
    const HEART_BASE = { width: 670, height: 625 };

    const $ = (id) => document.getElementById(id);

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        const letter = $('code');
        const heartHost = $('loveHeart');
        const canvas = $('garden');

        startClock();
        startFallingText();
        wireValentineWeek();
        wireLetterScrollHint();

        const heart = canvas && heartHost ? createHeart(canvas, heartHost) : null;

        if (reduceMotion.matches) {
            // No typing, no bloom-by-bloom reveal — everything is simply there.
            if (heart) heart.drawInstantly();
            revealMessages(true);
            document.body.classList.add('is-ready');
            return;
        }

        const typing = letter ? typeOut(letter, timing.typewriterSpeed || 75) : null;
        document.body.classList.add('is-ready');

        window.setTimeout(function () {
            if (!heart) {
                revealMessages(false);
                return;
            }
            heart.bloom(function () {
                revealMessages(false);
            });
        }, timing.heartAnimationDelay || 5000);

        // If the visitor decides mid-way that they'd rather read it all at once.
        if (typing) {
            const skip = function () { typing.skip(); };
            document.addEventListener('click', skip, { once: true });
            document.addEventListener('keydown', skip, { once: true });
            document.addEventListener('focusin', skip, { once: true });
        }
    }

    /* =================================================================
     * The letter
     * ============================================================= */

    /**
     * Reveals an element's text one character at a time.
     *
     * Walks the DOM once and animates the existing text nodes in place, so the
     * markup is never re-parsed and the structure is never rebuilt. Screen
     * readers get the finished letter up front instead of 90 seconds of churn.
     *
     * @returns {{skip: function}} handle for finishing early
     */
    function typeOut(root, msPerChar) {
        const steps = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);

        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (!node.data.length) continue;
                steps.push({ node: node, text: node.data });
                node.data = '';
            } else {
                node.classList.add('tw-pending');
                steps.push({ el: node });
            }
        }

        if (!steps.length) return { skip: function () {} };

        // A static, non-interactive copy for assistive tech while we animate.
        const transcript = document.createElement('div');
        transcript.className = 'sr-only';
        transcript.textContent = root.textContent;
        root.setAttribute('aria-hidden', 'true');
        root.parentNode.insertBefore(transcript, root.nextSibling);

        const caret = document.createElement('span');
        caret.className = 'tw-caret';
        caret.setAttribute('aria-hidden', 'true');

        let index = 0;
        let posInStep = 0;
        let revealed = 0;
        let caretAt = -1;
        let frame = null;
        let startedAt = null;
        let done = false;

        function placeCaret(node) {
            if (node && node.parentNode) node.parentNode.insertBefore(caret, node.nextSibling);
        }

        function tick() {
            // Read the clock directly rather than trusting the frame timestamp,
            // which can be 0 or frozen depending on how the page is being driven.
            const now = performance.now();
            if (startedAt === null) startedAt = now;
            const target = Math.floor((now - startedAt) / msPerChar);

            while (index < steps.length) {
                const step = steps[index];

                // Elements and markup whitespace are free — only the letters
                // she actually reads are worth spending time on.
                if (step.el) {
                    step.el.classList.remove('tw-pending');
                    index++;
                    continue;
                }

                if (posInStep >= step.text.length) {
                    index++;
                    posInStep = 0;
                    continue;
                }

                const isSpace = /\s/.test(step.text.charAt(posInStep));
                if (!isSpace && revealed >= target) break;

                posInStep++;
                if (!isSpace) revealed++;
                step.node.data = step.text.slice(0, posInStep);
            }

            if (index !== caretAt) {
                caretAt = index;
                const step = steps[Math.min(index, steps.length - 1)];
                placeCaret(step.node || step.el);
            }

            if (index >= steps.length) return finish();
            frame = window.requestAnimationFrame(tick);
        }

        function finish() {
            if (done) return;
            done = true;
            if (frame !== null) window.cancelAnimationFrame(frame);

            for (const step of steps) {
                if (step.el) step.el.classList.remove('tw-pending');
                else step.node.data = step.text;
            }

            caret.remove();
            transcript.remove();
            root.removeAttribute('aria-hidden');
            root.classList.add('is-typed');
        }

        frame = window.requestAnimationFrame(tick);
        return { skip: finish };
    }

    /** Fades the bottom edge of the letter only while there's more to scroll. */
    function wireLetterScrollHint() {
        const scroller = document.querySelector('.letter-scroll');
        const card = scroller && scroller.closest('.letter-card');
        if (!card) return;

        const update = function () {
            const atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
            card.classList.toggle('is-at-end', atEnd);
        };

        scroller.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update, { passive: true });

        // The letter grows as it types, so watch its height too.
        if ('ResizeObserver' in window) new ResizeObserver(update).observe(scroller.firstElementChild || scroller);
        update();
    }

    /* =================================================================
     * The heart
     * ============================================================= */

    function createHeart(canvas, host) {
        const garden = new window.Garden(canvas, config.garden);
        const angles = [];
        let complete = false;

        /** Parametric heart, scaled and centred inside whatever size the canvas is. */
        function pointAt(angle) {
            const scale = Math.min(garden.width / HEART_BASE.width, garden.height / HEART_BASE.height);
            const cx = garden.width / 2;
            const cy = garden.height / 2 - 55 * scale;
            const t = angle / Math.PI;

            const x = 19.5 * (16 * Math.pow(Math.sin(t), 3));
            const y = -20 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

            return [cx + x * scale, cy + y * scale];
        }

        /** True if this point is far enough from every point already stamped. */
        function isClear(point, placed) {
            const minDistance = garden.options.bloomRadius.max * 1.3;
            for (const p of placed) {
                const dx = p[0] - point[0];
                const dy = p[1] - point[1];
                if (Math.sqrt(dx * dx + dy * dy) < minDistance) return false;
            }
            return true;
        }

        function bloom(onDone) {
            let angle = 10;
            const placed = [];

            const timer = window.setInterval(function () {
                const point = pointAt(angle);

                if (isClear(point, placed)) {
                    placed.push(point);
                    angles.push(angle);
                    garden.createRandomBloom(point[0], point[1]);
                }

                if (angle >= 30) {
                    window.clearInterval(timer);
                    complete = true;
                    host.classList.add('is-bloomed');
                    if (onDone) onDone();
                } else {
                    angle += 0.2;
                }
            }, timing.heartStepInterval || 50);
        }

        /** Stamp the whole heart at once — used for reduced motion and redraws. */
        function drawInstantly() {
            const placed = [];
            garden.speed = 4;

            for (let angle = 10; angle < 30; angle += 0.2) {
                const point = pointAt(angle);
                if (!isClear(point, placed)) continue;
                placed.push(point);
                if (!complete) angles.push(angle);
                garden.createRandomBloom(point[0], point[1]);
            }

            complete = true;
            host.classList.add('is-bloomed');
        }

        // Resizing resets the canvas backing store, so repaint what was there.
        if ('ResizeObserver' in window) {
            let pending = null;
            new ResizeObserver(function () {
                window.clearTimeout(pending);
                pending = window.setTimeout(function () {
                    if (!garden.resize()) return;
                    garden.clear();
                    if (complete) drawInstantly();
                }, 150);
            }).observe(host);
        }

        return { bloom: bloom, drawInstantly: drawInstantly };
    }

    /** Fades in the counter, then the signature underneath it. */
    function revealMessages(immediate) {
        const messages = $('messages');
        const loveu = $('loveu');

        if (immediate) {
            if (messages) messages.classList.add('is-visible');
            if (loveu) loveu.classList.add('is-visible');
            return;
        }

        if (messages) {
            messages.style.transitionDuration = (timing.messagesFade || 5000) + 'ms';
            messages.classList.add('is-visible');
        }
        if (loveu) {
            window.setTimeout(function () {
                loveu.style.transitionDuration = (timing.loveuFade || 2000) + 'ms';
                loveu.classList.add('is-visible');
            }, (timing.messagesFade || 5000) + (timing.loveuDelay || 600));
        }
    }

    /* =================================================================
     * The counter
     * ============================================================= */

    function startClock() {
        const since = config.anniversaryDate;
        if (!(since instanceof Date)) return;

        const clockEl = $('elapseClock');
        const monthsEl = $('elapsedMonths');
        const yearsEl = $('elapsedYears');
        const dayMs = 24 * 3600 * 1000;
        let timer = null;

        const pad = (n) => (n < 10 ? '0' + n : String(n));
        const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

        function render() {
            const now = new Date();
            const totalSeconds = Math.max(Math.floor((now - since) / 1000), 0);

            const days = Math.floor(totalSeconds / (3600 * 24));
            const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            if (clockEl) {
                clockEl.innerHTML =
                    `<span class="digit">${days}</span> days ` +
                    `<span class="digit">${pad(hours)}</span> hours ` +
                    `<span class="digit">${pad(minutes)}</span> minutes ` +
                    `<span class="digit">${pad(seconds)}</span> seconds`;
            }

            // Calendar-aware months, so "1 month" means the same day next month.
            let totalMonths = (now.getFullYear() - since.getFullYear()) * 12 + (now.getMonth() - since.getMonth());
            if (new Date(since.getFullYear(), since.getMonth() + totalMonths, since.getDate()) > now) {
                totalMonths -= 1;
            }
            totalMonths = Math.max(totalMonths, 0);

            const anchor = new Date(since.getFullYear(), since.getMonth() + totalMonths, since.getDate());
            const daysRemaining = Math.max(Math.floor((now - anchor) / dayMs), 0);

            if (monthsEl) {
                monthsEl.textContent = `${plural(totalMonths % 12, 'month')} and ${plural(daysRemaining, 'day')}`;
            }
            if (yearsEl) {
                yearsEl.textContent = `${((now - since) / (365.25 * dayMs)).toFixed(1)} years`;
            }
        }

        function start() {
            if (timer !== null) return;
            render();
            timer = window.setInterval(render, timing.clockInterval || 1000);
        }

        function stop() {
            window.clearInterval(timer);
            timer = null;
        }

        // A counter nobody can see doesn't need to tick.
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stop();
            else start();
        });

        start();
    }

    /* =================================================================
     * The background rain
     * ============================================================= */

    const PHRASES = [
        // Weighted by repetition — English and Nepali fall most often.
        { text: 'I LOVE YOU', lang: 'en', weight: 4 },
        { text: 'म तिमीलाई माया गर्छु', lang: 'ne', weight: 4 },
        { text: 'TE AMO', lang: 'es', weight: 2 },
        { text: "JE T'AIME", lang: 'fr', weight: 2 },
        { text: '我爱你', lang: 'zh', weight: 2 },
        { text: 'TI AMO', lang: 'it', weight: 1 },
        { text: 'ICH LIEBE DICH', lang: 'de', weight: 1 },
        { text: 'EU TE AMO', lang: 'pt', weight: 1 },
        { text: 'Я ЛЮБЛЮ ТЕБЯ', lang: 'ru', weight: 1 },
        { text: '私はあなたを愛しています', lang: 'ja', weight: 1 },
        { text: '사랑해요', lang: 'ko', weight: 3 },
        { text: 'ฉันรักคุณ', lang: 'th', weight: 1 },
        { text: 'أنا أحبك', lang: 'ar', weight: 1 },
        { text: 'मैं तुम्हें प्यार करता हूँ', lang: 'hi', weight: 1 }
    ];

    function startFallingText() {
        const container = $('fallingTextContainer');
        if (!container) return;

        const opts = config.fallingText || {};
        const spawnInterval = opts.spawnInterval || 300;
        const maxOnScreen = opts.maxOnScreen || 46;
        const minDuration = opts.minDuration || 8;
        const maxDuration = opts.maxDuration || 15;

        // Expand the weights once so spawning is a single array lookup.
        const pool = [];
        for (const phrase of PHRASES) {
            for (let i = 0; i < phrase.weight; i++) pool.push(phrase);
        }
        if (!pool.length) return;

        let timer = null;
        let live = 0;

        function spawn() {
            if (live >= maxOnScreen) return;

            const phrase = pool[Math.floor(Math.random() * pool.length)];
            const el = document.createElement('div');
            const duration = Math.random() * (maxDuration - minDuration) + minDuration;
            // Three depth bands: nearer text is larger, brighter and faster.
            const depth = Math.floor(Math.random() * 3) + 1;

            el.className = 'falling-text depth-' + depth;
            el.lang = phrase.lang;
            el.textContent = phrase.text;
            el.style.left = (Math.random() * 100).toFixed(2) + '%';
            el.style.setProperty('--tilt', (Math.random() * 60 - 30).toFixed(1) + 'deg');
            el.style.animationDuration = duration.toFixed(2) + 's';

            live++;
            el.addEventListener('animationend', function () {
                el.remove();
                live--;
            }, { once: true });

            container.appendChild(el);
        }

        function start() {
            if (timer === null) timer = window.setInterval(spawn, spawnInterval);
        }

        function stop() {
            window.clearInterval(timer);
            timer = null;
        }

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stop();
            else start();
        });

        // Motion preference can change mid-visit; follow it either way.
        const apply = function () {
            if (reduceMotion.matches) {
                stop();
                container.replaceChildren();
                live = 0;
            } else {
                start();
            }
        };

        if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', apply);
        apply();
    }

    /* =================================================================
     * Valentine week
     * ============================================================= */

    const VALENTINE_MESSAGES = {
        rose: '🌹 Rose Day\n\nIf I could,\nI’d send you a garden instead of one rose…\n\nBut every flower would still be jealous of you.\n\nSo here’s my rose —\nCarrying all my love, softly reaching your heart.',
        propose: '💍 Propose Day\n\nIf loving you was a question,\nMy answer would always be YES.\n\nSo today, once again…\nI choose you.\n\nNot just for now —\nBut for every tomorrow waiting ahead of us.',
        chocolate: '🍫 Chocolate Day\n\nLife with you feels sweeter than chocolate…\n\nAnd trust me,\nI don’t even like sharing chocolate —\nBut I’d share my last piece with you.',
        teddy: '🧸 Teddy Day\n\nWhenever I’m not around,\nI hope you hug a teddy…\n\nAnd pretend it’s me —\nHolding you tight,\nProtecting your peace.',
        promise: '🤞 Promise Day\n\nI promise to stay —\nEven on days I don’t understand you.\n\nI promise to listen —\nEven when words are hard to say.\n\nAnd most of all,\nI promise to love you louder than life gets.',
        hug: '🤗 Hug Day\n\nIf you were here right now,\nI wouldn’t say a word…\n\nI’d just pull you close —\nAnd let my arms explain everything.',
        kiss: '💋 Kiss Day\n\nA kiss from you isn’t just a kiss…\n\nIt’s my peace,\nMy silence,\nMy favorite place to rest my soul.',
        valentine: '❤️ Valentine’s Day\n\nOut of all the people in this world…\n\nMy heart found you.\n\nAnd if I had to live life again —\nI’d still search for you,\nStill fall for you,\nStill choose you…\n\nEvery single time.'
    };

    function wireValentineWeek() {
        const box = $('valentineMessage');
        const buttons = document.querySelectorAll('.valentine-btn');
        if (!box || !buttons.length) return;

        document.addEventListener('click', function (event) {
            const button = event.target.closest('.valentine-btn');
            if (!button) return;

            const message = VALENTINE_MESSAGES[button.dataset.day];
            if (!message) return;

            for (const other of buttons) {
                other.setAttribute('aria-pressed', String(other === button));
            }

            // Retrigger the entrance even when the same day is clicked twice.
            box.classList.remove('is-visible');
            void box.offsetWidth;
            box.textContent = message;
            box.classList.add('is-visible');
        });
    }
})();
