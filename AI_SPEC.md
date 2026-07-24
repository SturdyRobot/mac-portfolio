# AI_SPEC — how this repo is built

This project is built **AI-native**: I ([Noel Jackson](https://nlj.dev)) own the
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

## Complex features, concretely

The two hardest pieces were structured to keep AI-generated complexity *contained*:

**RC Playground — the 3D engine** (`public/games/playground/`). This is the most complex
single artifact: a real-time 3D driving game with [three.js](https://threejs.org) for
rendering and [cannon-es](https://github.com/pmndrs/cannon-es) for rigid-body physics
(suspension, jumps, a boost pad, a lap timer). The direction I gave was structural first:
build it as a **fully self-contained page behind the iframe boundary**, so all of its
3D/physics complexity — the render loop, the physics step, the vehicle model — lives in one
file and can't leak into the OS runtime or fight React for the event loop. The OS reaches it
through exactly one manifest line (`type: 'iframe'`); it knows nothing else about it. That
boundary is what made it safe to let an agent iterate hard on a 700-line physics loop without
risking the rest of the desktop.

**The window manager** (`src/store.js`). The opposite problem — this one has to be shared by
everything. I defined the store's shape up front (open windows, z-order, drag/resize/
minimize/shade, theme, power) as a single Zustand store, and the rule that **views only read
from it**. Agent-generated UI plugs into that store instead of inventing local state, which is
why rapid window drags update coordinates without triggering global re-render cascades. It's
now typed (`OSState` in `src/types.d.ts`) and checked under strict TypeScript, so a malformed
state update is a compile error, not a runtime surprise.

The pattern in both: **I own the boundary; the agent works inside it.**

## Verification, not vibes

The tooling I build reflects the same principle. [Aegis](https://github.com/nlj3/aegis)
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
