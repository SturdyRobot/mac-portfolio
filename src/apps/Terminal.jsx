import { useState, useRef, useEffect } from 'react'
import { useOS } from '../store.js'
import { apps } from '../apps.js'

// ── a tiny virtual filesystem that shows off the real work ──
const FS = {
  'about.txt':
    'Noel Jackson  —  "Sturdy Robot"\n' +
    'Software developer & systems administrator.\n' +
    'I build a bit of everything: apps, tools, games,\n' +
    'and the systems behind them.',
  'contact.txt':
    'email :  noeljacksonjs@gmail.com\n' +
    'github:  github.com/SturdyRobot\n' +
    'web   :  sturdyrobot.io',
  'README.txt':
    "Welcome to the terminal. Type 'help' to get started.\n" +
    "Try:  ls  ·  cat about.txt  ·  neofetch  ·  open worldframe",
  projects: {
    'worldframe.txt':
      'WorldFrame — my flagship worldbuilding app.\n' +
      'Launch it:  open worldframe   (or visit tryworldframe.com)',
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
      'no evil master plan here — just a dev who likes building things.\n' +
      'now go hire him:  noeljacksonjs@gmail.com',
    'god_mode.sh': '#!/bin/sh\necho "with great power comes great responsibility"',
  },
}

const BANNER = [
  '   ___ _              _        ___     _        _   ',
  "  / __| |_ _  _ _ _ __| |_  _  | _ \\___| |__ ___| |_ ",
  " _\\__ \\  _| || | '_/ _` | || | |   / _ \\ '_ \\ _ \\  _|",
  ' |___/\\__|\\_,_|_| \\__,_|\\_, | |_|_\\___/_.__|___/\\__|',
  '                        |__/                        ',
  "  sturdyrobot.io — type 'help' for commands",
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
    return ['deleting /…', 'deleting /home…', 'deleting everything…', '', '😄 just kidding. your files are safe.']
      .map((t, i) => mk(t, i === 4 ? 'y' : 'r'))
  if (c.startsWith('rm '))
    return [mk("rm: this terminal is a museum piece — please don't 🏛️", 'y')]
  if (c.startsWith('make '))
    return [mk(`make: *** No rule to make target '${c.slice(5).trim()}'.  Stop.`, 'y')]
  return null
}

export default function Terminal() {
  const openApp = useOS((s) => s.openApp)
  const [lines, setLines] = useState(() => BANNER.map((t) => ({ t, c: 'g' })))
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState([]) // path segments under root
  const [hist, setHist] = useState([])
  const [hIdx, setHIdx] = useState(-1)
  const [hacked, setHacked] = useState(false)
  const bodyRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [lines])

  const prompt = `${hacked ? 'root' : 'noel'}@sturdyrobot ${'/' + cwd.join('/')} $`
  const out = (arr) => setLines((l) => [...l, ...arr])
  const say = (t, c) => ({ t, c: c || '' })

  // cinematic "hack the mainframe" — reveals output over ~4s, then unlocks /root
  function runHack(target) {
    const rand = () => Math.random().toString(16).slice(2, 10).toUpperCase()
    const steps = [
      ['> initializing exploit kit…', 'g', 250],
      [`> target: ${target || 'sturdyrobot.io'} :: mainframe`, 'g', 350],
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

    // developer easter eggs first
    const egg = eggs(cmd.toLowerCase().replace(/\s+/g, ' '))
    if (egg) { out(egg); return }

    const [name, ...args] = cmd.split(/\s+/)
    const arg = args.join(' ')
    const here = dirAt(cwd)

    switch (name.toLowerCase()) {
      case 'help':
        out([
          say('available commands:', 'y'),
          say('  ls          list files here'),
          say('  cd <dir>    change directory ( .. to go up )'),
          say('  cat <file>  print a file'),
          say('  open <app>  launch an app on the desktop'),
          say('  apps        list launchable apps'),
          say('  whoami · pwd · date · echo · neofetch · clear'),
          say('  sudo <cmd>  ( go on, try it )', 'dim'),
          say('  hack        breach the mainframe 🔓  (there\'s a flag…)', 'dim'),
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
        out([say(hacked ? 'root  😎  (you hacked in)' : 'noel  (aka Sturdy Robot)')])
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
          say('        .--.       noel@sturdyrobot', 'g'),
          say('       |o_o |      ---------------', 'g'),
          say('       |:_/ |      OS:      Sturdy Robot OS 8.1', 'g'),
          say('      //   \\ \\     Shell:   sh (retro)', 'g'),
          say('     (|     | )    Role:    dev + sysadmin', 'g'),
          say("    /'\\_   _/`\\    Uptime:  since 199x", 'g'),
          say('    \\___)=(___/    Web:     sturdyrobot.io', 'g'),
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
        out([say(`command not found: ${name}. type 'help'`, 'r')])
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
          <div key={i} className={`term-line ${l.c}`}>{l.t || ' '}</div>
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
