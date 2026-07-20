// Renders the right thing based on an app's `type` from the manifest.
export default function AppContent({ app }) {
  if (!app) return null

  if (app.type === 'component') {
    const C = app.component
    return <C />
  }

  if (app.type === 'iframe' || app.type === 'url') {
    return (
      <iframe
        className="app-iframe"
        src={app.src}
        title={app.name}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    )
  }

  if (app.type === 'html') {
    return <div dangerouslySetInnerHTML={{ __html: app.src }} />
  }

  return <div style={{ padding: 12 }}>Unknown app type: {app.type}</div>
}
