# A Note

**An interactive love letter.** The note types itself out, a heart blooms rose
by rose on a canvas, and a counter runs from the night of the first message and
never stops. Multilingual "I love you" falls quietly in the background.

**Owner:** Bibesh

## ✨ What's in it

- A letter that types itself — click, tap or press any key to reveal it all at once
- A heart drawn one bezier rose at a time on `<canvas>`, crisp on retina
- A live counter: days/hours/minutes/seconds, calendar-aware months, decimal years
- Valentine week — eight days, eight notes
- Light and dark themes, chosen automatically from the system
- Mobile first, and side by side on a wide screen
- Zero dependencies, zero build step, ~55 KB total, no third-party requests

## 📱 How it adapts

The stylesheet is written mobile first: the base rules describe a phone, and
each `min-width` query adds room as it appears.

| Width | Layout |
| --- | --- |
| **< 1024px** | One column, one page scroll. The letter fills the first screen and runs at its full natural length; the heart sits below it. |
| **≥ 1024px** | Two even columns — the letter gets its own scrollport so it stands level with the heart. |
| **≥ 1200px** | The letter settles at 560px and the heart at the 670px its curve was tuned for. |

On a phone the heart waits below the fold and blooms **when she scrolls to
it**, so the animation never plays to an empty screen. The counter inside the
heart is sized with container queries, so it scales with the heart rather than
the window — on a phone it renders at 19px, on a desktop at 34px, and it stays
inside the shape at every size in between.

## 🚀 Run it

Open `index.html` in a browser. That's it.

For a local server (any will do):

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Deploys automatically to GitHub Pages on every push to `main`
(`.github/workflows/static.yml`).

## 🛠 Customize

Everything tunable lives in [`config.js`](config.js) — the date being counted,
names, animation timing, the rose palette, and the density of the background rain.

| I want to change… | Edit |
| --- | --- |
| The date, names, timing | `config.js` |
| The letter itself | the `#code` block in `index.html` (keep the `<br />` tags) |
| Colors, spacing, theme | the token block at the top of `css/default.css` |
| How the roses look | `CONFIG.garden` in `config.js` |

**Typing speed:** `CONFIG.timing.typewriterSpeed` is milliseconds per character.
At the default `75` the letter takes about a minute — whitespace is free, so only
the characters she actually reads cost time. Drop it to `35` to halve that.

## 📁 Files

```
index.html          markup — the letter lives here
config.js           every tunable value, single source of truth
css/default.css     design tokens, layout, both themes
js/garden.js        the rose particle system (Vector → Petal → Bloom → Garden)
js/functions.js     choreography: typewriter, heart, counter, rain, buttons
```

## ♿ Accessibility & performance notes

- Honours `prefers-reduced-motion`: no rain, no typing, the heart is simply
  already drawn. Also respects `prefers-reduced-transparency` and
  `prefers-contrast`.
- While the letter types, screen readers get the finished text instead of the
  animation, and any keypress or focus jumps straight to the end.
- Every loop parks itself: the canvas stops rendering when the last petal
  finishes, and the counter and background rain pause when the tab is hidden.
- Phones get a thinner, slower background rain (20 phrases vs 46) and a lighter
  glass blur; tap targets are 44px.
- Prints cleanly — the letter alone, on white.

## 📝 License

Open-source for personal use and customization.

**Made with ❤️ by Bibesh**
