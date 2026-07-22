import { Component } from 'react'

// Keeps one misbehaving app (or the whole shell) from white-screening the site.
// `variant="app"` renders a compact in-window notice; the default fills the screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.warn('[caught by ErrorBoundary]', error, info?.componentStack)
  }

  reset = () => this.setState({ failed: false })

  render() {
    if (!this.state.failed) return this.props.children

    if (this.props.variant === 'app') {
      return (
        <div className="app-crash">
          <div className="app-crash-bomb">💣</div>
          <p>This little app hit a snag.</p>
          <button className="btn" onClick={this.reset}>
            Try again
          </button>
        </div>
      )
    }

    return (
      <div className="os-crash">
        <div className="os-crash-box">
          <div className="os-crash-bomb">💣</div>
          <h2>Sorry — something went wrong.</h2>
          <p>The desktop ran into an unexpected error.</p>
          <button className="btn" onClick={() => window.location.reload()}>
            Restart
          </button>
        </div>
      </div>
    )
  }
}
