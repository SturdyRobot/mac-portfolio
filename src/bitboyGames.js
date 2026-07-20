// ═══════════════════════════════════════════════════════════════════
//  BITBOY COLOR — game cartridges.
//
//  Each entry is a "cartridge" that shows up in the handheld's menu.
//  Add a game as you build it — one line here and it appears.
//
//  type: 'iframe' → a self-contained game at /public/bitboy/<name>/index.html
//                   (make it listen for arrow keys + Enter so the on-screen
//                    D-pad and buttons drive it).
//  color:         → the cartridge label tint in the menu (just cosmetic).
// ═══════════════════════════════════════════════════════════════════

export const bitboyGames = [
  {
    id: 'snake',
    name: 'SNAKE',
    type: 'iframe',
    src: '/bitboy/snake/index.html',
    color: '#57e389',
  },
  {
    id: 'jungle',
    name: 'JUNGLE RUN',
    type: 'iframe',
    src: '/bitboy/jungle/index.html',
    color: '#ffd23f',
  },
  // {
  //   id: 'yourgame',
  //   name: 'YOUR GAME',
  //   type: 'iframe',
  //   src: '/bitboy/yourgame/index.html',
  //   color: '#ffcc00',
  // },
]
