# Winner screenshot regression

Run from `kahaiz_wheel` with Node.js 18 or newer:

```powershell
npm ci
npm run build
npm run test:screenshot
```

The tests serve the generated production `index.html`, its `dist` bundle, and the
real artwork on loopback port 4178. They do not use a test-only winner component
or a replacement canvas renderer. Playwright selects a single winner, drags the
wheel, and advances the spin clock; the actual Copy button produces every PNG.
The server and headless browser are stopped by the runner.

Windows uses installed Microsoft Edge by default. To use installed Chrome,
set `$env:PLAYWRIGHT_CHANNEL = 'chrome'`. On other platforms the default is
Playwright Chromium (`npx playwright install chromium` if it is not installed).
The native clipboard tests write/read an image through the browser clipboard API.

## What is protected

- Desktop (1280×900, DPR 1, dark preference) and mobile (390×844, DPR 2,
  light preference). The application itself has one OSRS dark theme.
- Boss, BOTW, and SOTW, including tall transparent Amoxliatl artwork, wide
  Vorkath artwork, and Magic's dark-color text-brightness adjustment.
- Real decoded PNG pixels against a native browser rendering of the same
  settled card, excluding its controls and decorative glow as the export already
  does. Only the reference, **after export**, has its animations disabled.
- Opaque artwork pixel brightness within 4% of the browser and mean RGB error
  below 5/255, allowing a one-device-pixel rasterization offset. Name/subtitle
  colors must contain matching foreground pixels. PNG alpha must be opaque.
- Stable repeated exports, preserved live animations/controls, native clipboard
  round-trip pixel equality, pending-write disabling, and denied-write retry.

Each color test saves `export.png`, `browser-reference.png`, and `fidelity.json`
under ignored `test-results/current`, with a JSON run report at
`test-results/current-report.json`.
Use `$env:SCREENSHOT_TEST_LABEL = 'baseline'` (or another label) to keep separate
runs. Browser fonts are the same external RuneScape fonts/fallbacks used by the
app; the reference and export are compared in the same browser rather than
against platform-specific golden images.

## Capture invariant

html2canvas 1.4.1 clones the document and restarts the banner's `popIn` animation.
It reads the clone's computed opacity and transform before disabling animations
itself. A fully visible live winner can therefore be exported at partial opacity
and reduced scale. Freeze the banner and its descendants in `onclone`, before
the renderer reads styles; do not remove the live animation or compensate with
brightness/gamma changes.

html2canvas also does not support `object-fit: contain`. The clone expresses the
same centered content box with padding, preserving the source artwork's aspect
ratio without changing live CSS. Existing decorative CSS image filters are not
part of the pixel assertions; html2canvas does not render those filters.

There is no separate download/fallback export control in this app. Clipboard
encoding and writes are awaited, so a failed write does not produce an unhandled
rejection or a false success state, and the Copy button can be retried.
