# AI_SPEC — how this repo is built

This project is built **AI-native**: I ([Noel Jackson](https://sturdyrobot.io)) own the
architecture, the product decisions, and the review; I direct an AI coding agent —
**Claude Code** — to do implementation, asset generation, and verification under that
direction. This document is an honest account of *how*, not a marketing claim.

One note up front, because it matters: I don't keep a verbatim archive of every prompt,
and I won't manufacture one to look like a paper trail. What follows is the actual method
and division of labor. Where a "spec" is shown, it's *representative* of how I frame work
for the agent — not a retrieved transcript.

## Division of labor

**I own:**
- Architecture and the core contracts — the app manifest schema, the window-manager
  store's shape, the game ↔ OS boundaries.
- Product and taste — what gets built, what gets cut, what "good" looks like.
- Review — I read, test, refactor, and reject.

**The agent does, under direction:**
- Implementation against the contracts I set.
- Asset generation — the pixel-art sprites (the Tamachu life-cycle, game art) and UI copy —
  art-directed, then hand-tuned.
- Test and verification passes, including headless-browser visual QA.

## How a feature actually gets built

1. **I define the contract.** The most important one is the manifest: one plain object per
   app, describing its type, icon, window, and placement — so rendering logic never needs to
   know about any individual app, and adding one is a single-line change.
2. **The agent drafts** the component or game against that contract.
3. **I verify in a real browser** — screenshots, DOM and console checks, a mobile viewport —
   before anything lands. Nothing ships on "looks right."
4. **I refactor or reject.** Wrong output gets thrown away, not patched around.

## The contract that makes this work (real, from `src/apps.js`)

Everything on the desktop is data. A whole app is one entry:

```js
{
  id: 'rc-playground',
  name: 'RC Playground',
  type: 'iframe',          // component | iframe | url | link
  icon: '🚗',
  src: '/games/playground/index.html',
  window: { w: 640, h: 480 },
  onDesktop: true,
  menu: true,
}
```

The rule I hand the agent: **new work is one entry here; the window manager stays ignorant of
any specific app.** That single constraint is what keeps AI-generated features small, safe,
and reviewable — the blast radius of any one app is its own file plus one manifest line.

The other contract is the state store (`src/store.js`, Zustand): it owns open windows,
z-order, drag/resize/minimize/shade, the theme, and the power state. Views (`MenuBar`,
`Desktop`, `Window`, `AppContent`) are thin and read from it. Agent-generated UI plugs into
that store rather than inventing its own state — which is why rapid window drags don't trigger
global re-render cascades.

## Verification, not vibes

The tooling I build reflects the same principle. [SturdyHarness](https://github.com/SturdyRobot/sturdy-harness)
runs AI agents under hard budgets with byte-identical replay, so an agent's effect is
reproducible and checkable rather than a matter of trust. In this repo the equivalent
discipline is two things:

- **Browser-in-the-loop QA** — every visual change is checked in a real headless browser
  (screenshots, console, mobile) before it's committed.
- **A CI build gate** — `.github/workflows/ci.yml` builds the project on every push (Node 18
  and 20). Machine-written code passes the same gate as anything else. (Real automated tests
  are the honest next step; today CI is build-verification, and I'm not going to call it more
  than it is.)

## What AI did *not* do

It didn't decide the architecture, pick the retro-OS concept, set the quality bar, or choose
what to cut. Those are the parts that make a broad, AI-generated surface actually *cohere* into
something shippable — and they're mine. The velocity is the agent's; the judgment is the point.
