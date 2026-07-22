import ErrorBoundary from './ErrorBoundary.jsx'

// Renders the right thing based on an app's `type` from the manifest.
export default function AppContent({ app }) {
  if (!app) return null

  if (app.type === 'component') {
    const C = app.component
    return (
      <ErrorBoundary variant="app">
        <C />
      </ErrorBoundary>
    )
  }

  if (app.type === 'iframe' || app.type === 'url') {
    // games are keyboard-driven — hand the iframe focus as soon as it loads so the
    // player doesn't have to click inside first before the arrow keys register.
    const focusOnLoad =
      app.category === 'Games'
        ? (e) => { try { e.target.focus(); e.target.contentWindow?.focus() } catch (_) {} }
        : undefined
    return (
      <iframe
        className="app-iframe"
        src={app.src}
        title={app.name}
        onLoad={focusOnLoad}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    )
  }

  if (app.type === 'html') {
    return <div dangerouslySetInnerHTML={{ __html: app.src }} />
  }

  return <div style={{ padding: 12 }}>Unknown app type: {app.type}</div>
}
