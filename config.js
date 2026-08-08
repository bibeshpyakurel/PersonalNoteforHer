/**
 * A Note — configuration
 * Created by Bibesh · Personalized for Bibesh & Anushka
 *
 * This is the single source of truth. index.html loads this file first,
 * and js/garden.js + js/functions.js read from it. Change a value here
 * and the whole page follows.
 */

const CONFIG = {
    /* ---------------------------------------------------------------
     * The moment we're counting from.
     * Format: new Date(YEAR, MONTH (0-11), DAY, HOUR, MINUTE, SECOND)
     * April 13, 2025 · 12:32 AM
     * ------------------------------------------------------------- */
    anniversaryDate: new Date(2025, 3, 13, 0, 32, 0),

    recipientName: 'Anushka',
    senderName: 'BIBESH',
    message: 'I LOVE YOU SO MUCH',

    /* ---------------------------------------------------------------
     * Choreography. Every number is in milliseconds.
     * The page reveals itself in this order:
     *   letter types out → heart blooms → counter fades in → signature
     * ------------------------------------------------------------- */
    timing: {
        typewriterSpeed: 75,        // ms per character of the letter
        heartAnimationDelay: 5000,  // wait before the heart starts blooming
        heartStepInterval: 50,      // ms between rose blooms along the heart
        messagesFade: 5000,         // counter fade-in duration
        loveuFade: 2000,            // signature fade-in duration
        loveuDelay: 600,            // pause between counter and signature
        clockInterval: 1000         // counter tick
    },

    /* ---------------------------------------------------------------
     * The rose particle system that draws the heart.
     * ------------------------------------------------------------- */
    garden: {
        petalCount: { min: 8, max: 15 },
        petalStretch: { min: 0.1, max: 3 },
        growFactor: { min: 0.1, max: 1 },
        bloomRadius: { min: 8, max: 10 },
        color: {
            rmin: 128, rmax: 255,
            gmin: 0, gmax: 128,
            bmin: 0, bmax: 128,
            opacity: 0.1
        }
    },

    /* ---------------------------------------------------------------
     * The "I love you" rain in the background.
     * ------------------------------------------------------------- */
    fallingText: {
        spawnInterval: 300,         // ms between new phrases
        maxOnScreen: 46,            // hard cap, keeps the DOM light
        spawnIntervalCompact: 520,  // phones (< 600px): thinner and slower
        maxOnScreenCompact: 20,
        minDuration: 8,             // seconds to fall
        maxDuration: 15
    }
};

/* Exposed for any script that loads later. */
window.CONFIG = CONFIG;
