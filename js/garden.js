/**
 * garden.js — the rose particle system that draws the heart.
 *
 * Each "bloom" is a flower built from bezier petals that grow outward from a
 * point. Blooms are stamped along the parametric heart curve, and because the
 * canvas is never cleared, they accumulate into a single painted heart.
 *
 * Rendering is requestAnimationFrame-driven and parks itself the moment the
 * last petal finishes growing, so an idle page costs nothing.
 */
(function (global) {
    'use strict';

    const TAU = Math.PI * 2;
    const degToRad = (deg) => (TAU / 360) * deg;
    const random = (min, max) => Math.random() * (max - min) + min;
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    /** Minimal 2D vector. Mutates in place — these are hot-path objects. */
    class Vector {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        rotate(theta) {
            const { x, y } = this;
            this.x = Math.cos(theta) * x - Math.sin(theta) * y;
            this.y = Math.sin(theta) * x + Math.cos(theta) * y;
            return this;
        }

        mult(f) {
            this.x *= f;
            this.y *= f;
            return this;
        }

        clone() {
            return new Vector(this.x, this.y);
        }
    }

    /** One petal: a bezier loop that grows from radius 1 out to the bloom radius. */
    class Petal {
        constructor(stretchA, stretchB, startAngle, angle, growFactor, bloom) {
            this.stretchA = stretchA;
            this.stretchB = stretchB;
            this.startAngle = startAngle;
            this.angle = angle;
            this.growFactor = growFactor;
            this.bloom = bloom;
            this.r = 1;
            this.isFinished = false;
        }

        draw() {
            const ctx = this.bloom.garden.ctx;
            const v1 = new Vector(0, this.r).rotate(degToRad(this.startAngle));
            const v2 = v1.clone().rotate(degToRad(this.angle));
            const v3 = v1.clone().mult(this.stretchA);
            const v4 = v2.clone().mult(this.stretchB);

            ctx.strokeStyle = this.bloom.color;
            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            ctx.bezierCurveTo(v3.x, v3.y, v4.x, v4.y, v2.x, v2.y);
            ctx.stroke();
        }

        /** @param {number} speed growth multiplier, 1 = normal, high = instant */
        render(speed) {
            if (this.r <= this.bloom.r) {
                this.r += this.growFactor * speed;
                this.draw();
            } else {
                this.isFinished = true;
            }
        }
    }

    /** A flower of `petalCount` petals radiating from a point. */
    class Bloom {
        constructor(position, radius, color, petalCount, garden) {
            this.p = position;
            this.r = radius;
            this.color = color;
            this.garden = garden;
            this.petals = [];

            const angle = 360 / petalCount;
            const startAngle = randomInt(0, 90);
            const { petalStretch, growFactor } = garden.options;

            for (let i = 0; i < petalCount; i++) {
                this.petals.push(new Petal(
                    random(petalStretch.min, petalStretch.max),
                    random(petalStretch.min, petalStretch.max),
                    startAngle + i * angle,
                    angle,
                    random(growFactor.min, growFactor.max),
                    this
                ));
            }

            garden.addBloom(this);
        }

        draw(speed) {
            const ctx = this.garden.ctx;
            let finished = true;

            ctx.save();
            ctx.translate(this.p.x, this.p.y);
            for (const petal of this.petals) {
                petal.render(speed);
                finished = finished && petal.isFinished;
            }
            ctx.restore();

            if (finished) this.garden.removeBloom(this);
        }
    }

    /**
     * Owns the canvas, the bloom list, and the render loop.
     * Handles device-pixel-ratio scaling so the heart stays crisp on retina.
     */
    class Garden {
        constructor(canvas, options) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.options = options;
            this.blooms = [];
            this.speed = 1;
            this.frame = null;
            this.dpr = 1;

            this.tick = this.tick.bind(this);
            this.resize();
        }

        /**
         * Match the backing store to the CSS size × devicePixelRatio.
         * Clears the canvas as a side effect — callers redraw after this.
         */
        resize() {
            const rect = this.canvas.getBoundingClientRect();
            const dpr = Math.min(global.devicePixelRatio || 1, 2);
            const width = Math.max(Math.round(rect.width), 1);
            const height = Math.max(Math.round(rect.height), 1);

            if (this.width === width && this.height === height && this.dpr === dpr) {
                return false;
            }

            this.width = width;
            this.height = height;
            this.dpr = dpr;

            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;

            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // Additive blending: overlapping petals build up into a glow.
            this.ctx.globalCompositeOperation = 'lighter';
            return true;
        }

        addBloom(bloom) {
            this.blooms.push(bloom);
            this.start();
        }

        removeBloom(bloom) {
            const i = this.blooms.indexOf(bloom);
            if (i !== -1) this.blooms.splice(i, 1);
        }

        createBloom(x, y, radius, color, petalCount) {
            return new Bloom(new Vector(x, y), radius, color, petalCount, this);
        }

        /** A bloom with randomized size, petal count and rose-family color. */
        createRandomBloom(x, y) {
            const { bloomRadius, petalCount } = this.options;
            this.createBloom(
                x, y,
                randomInt(bloomRadius.min, bloomRadius.max),
                this.randomColor(),
                randomInt(petalCount.min, petalCount.max)
            );
        }

        /** Rose reds and violets — rejects anything that came out grey. */
        randomColor() {
            const c = this.options.color;
            for (let attempt = 0; attempt < 8; attempt++) {
                const r = Math.round(random(c.rmin, c.rmax));
                const g = Math.round(random(c.gmin, c.gmax));
                const b = Math.round(random(c.bmin, c.bmax));
                const isGrey = Math.abs(r - g) <= 5 && Math.abs(g - b) <= 5 && Math.abs(b - r) <= 5;
                if (!isGrey) return `rgba(${r},${g},${b},${c.opacity})`;
            }
            return `rgba(${c.rmax},${c.gmin},${c.bmin},${c.opacity})`;
        }

        clear() {
            this.blooms.length = 0;
            this.ctx.clearRect(0, 0, this.width, this.height);
        }

        /** Wake the loop. No-op if already running. */
        start() {
            if (this.frame === null) this.frame = global.requestAnimationFrame(this.tick);
        }

        stop() {
            if (this.frame !== null) {
                global.cancelAnimationFrame(this.frame);
                this.frame = null;
            }
        }

        tick() {
            // draw() can splice, so iterate backwards.
            for (let i = this.blooms.length - 1; i >= 0; i--) {
                this.blooms[i].draw(this.speed);
            }
            // Nothing left to grow: park the loop until the next bloom arrives.
            this.frame = this.blooms.length ? global.requestAnimationFrame(this.tick) : null;
        }
    }

    Garden.random = random;
    Garden.randomInt = randomInt;
    Garden.degToRad = degToRad;

    global.Garden = Garden;
})(window);
