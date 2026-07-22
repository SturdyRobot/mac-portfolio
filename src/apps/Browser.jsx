import { useState } from 'react'
import { domainKey, resolveSite, siteDirectory } from '../sites.js'

const HOME = 'about:home'

export default function Browser() {
  const [address, setAddress] = useState('')
  const [view, setView] = useState({ mode: 'home' }) // home | site | notfound
  const [, setHistory] = useState([])

  const directory = siteDirectory()

  const go = (input) => {
    const raw = String(input || '').trim()
    if (!raw || raw === HOME) {
      setAddress('')
      setView({ mode: 'home' })
      return
    }
    const key = domainKey(raw)
    const site = resolveSite(key)
    setAddress(key)
    setHistory((h) => [...h, key])
    if (site) {
      setView({ mode: 'site', path: site.path, name: site.name })
    } else {
      setView({ mode: 'notfound', key })
    }
  }

  return (
    <div className="browser">
      <div className="browser-toolbar">
        <button className="btn" title="Home" onClick={() => go(HOME)}>⌂</button>
        <input
          className="address-bar"
          placeholder="Type a website, e.g. cocacola.com"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go(address)}
        />
        <button className="btn" onClick={() => go(address)}>Go</button>
      </div>

      <div className="browser-bookmarks">
        <span className="bookmark" onClick={() => go(HOME)}>Home</span>
        {directory.map((s) => (
          <span key={s.domain} className="bookmark" onClick={() => go(s.domain)}>
            {s.name}
          </span>
        ))}
      </div>

      <div className="browser-viewport">
        {view.mode === 'home' && (
          <div className="browser-home">
            <h3 className="dir-title">Redesigned by me</h3>
            {directory.length === 0 ? (
              <>
                <div className="browser-home-glyph">🌐</div>
                <p className="dir-sub">
                  No redesigns registered yet. Add one in{' '}
                  <code>src/sites.js</code> and it'll show up here.
                </p>
              </>
            ) : (
              <>
                <p className="dir-sub">
                  Type any of these into the bar above — you'll get my version.
                </p>
                <div className="dir-grid">
                  {directory.map((s) => (
                    <button
                      key={s.domain}
                      className="dir-card"
                      onClick={() => go(s.domain)}
                    >
                      <div className="dir-card-dot" />
                      <div className="dir-card-domain">{s.domain}</div>
                      <div className="dir-card-tag">{s.tagline}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {view.mode === 'notfound' && (
          <div className="browser-home">
            <div className="nf-glyph">✋</div>
            <h3>{view.key}</h3>
            <p>I haven't redesigned this one yet.</p>
            <p className="dim">Here's what I have redesigned:</p>
            <div className="dir-grid">
              {directory.map((s) => (
                <button
                  key={s.domain}
                  className="dir-card"
                  onClick={() => go(s.domain)}
                >
                  <div className="dir-card-dot" />
                  <div className="dir-card-domain">{s.domain}</div>
                  <div className="dir-card-tag">{s.tagline}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {view.mode === 'site' && (
          <iframe
            className="app-iframe"
            src={view.path}
            title={view.name}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
      </div>
    </div>
  )
}
