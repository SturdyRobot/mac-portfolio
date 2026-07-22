import { useState, useEffect } from 'react'

// Reads the shared global board from /leaderboard.php, with a localStorage
// fallback (so it still shows something in dev / if the endpoint is down).
const GAMES = [
  { id: 'jungle', name: 'Jungle Run', accent: '#3fa35a' },
  { id: 'snake', name: 'Snake', accent: '#57e389' },
  { id: 'breakout', name: 'Breakout', accent: '#3b6ea5' },
]
const MAX = 10

function localBoard(id) {
  try {
    const a = JSON.parse(localStorage.getItem('arcade.scores.' + id) || '[]')
    return (Array.isArray(a) ? a : []).slice().sort((x, y) => y.score - x.score).slice(0, MAX)
  } catch {
    return []
  }
}

async function fetchBoard(id) {
  try {
    const r = await fetch('/leaderboard.php?game=' + encodeURIComponent(id), { cache: 'no-store' })
    if (!r.ok) throw 0
    const data = await r.json()
    if (!Array.isArray(data)) throw 0
    try { localStorage.setItem('arcade.scores.' + id, JSON.stringify(data)) } catch {}
    return data
  } catch {
    return localBoard(id)
  }
}

export default function HighScores() {
  const [tab, setTab] = useState('jungle')
  const [board, setBoard] = useState(() => localBoard('jungle'))
  const [loading, setLoading] = useState(false)

  const refresh = async (id = tab) => {
    setLoading(true)
    setBoard(localBoard(id)) // show cached instantly
    const fresh = await fetchBoard(id)
    setBoard(fresh)
    setLoading(false)
  }

  useEffect(() => { refresh(tab) }, [tab])

  const game = GAMES.find((g) => g.id === tab)

  const rows = []
  for (let i = 0; i < MAX; i++) {
    const e = board[i]
    rows.push(
      <div className={`hs-row ${i === 0 && e ? 'hs-first' : ''}`} key={i}>
        <span className="hs-rank">{i + 1}</span>
        <span className="hs-tag">{e ? e.tag : '– – –'}</span>
        <span className="hs-score">{e ? String(e.score).padStart(6, '0') : '000000'}</span>
      </div>
    )
  }

  return (
    <div className="highscores">
      <div className="hs-head">
        <span className="hs-trophy">🏆</span>
        <span className="hs-title">HIGH SCORES</span>
      </div>
      <div className="hs-tabs">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={`hs-tab ${tab === g.id ? 'on' : ''}`}
            onClick={() => setTab(g.id)}
          >
            {g.name}
          </button>
        ))}
      </div>
      <div className="hs-board" style={{ '--accent': game.accent }}>
        {rows}
      </div>
      <div className="hs-foot">
        <span className="hs-world">🌍 worldwide</span>
        <button className="hs-btn" onClick={() => refresh()} disabled={loading}>
          {loading ? '…' : 'Refresh'}
        </button>
      </div>
    </div>
  )
}
