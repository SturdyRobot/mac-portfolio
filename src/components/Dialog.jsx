import { useOS } from '../store.js'

// A classic retro-OS alert box, driven by store.dialog.
export default function Dialog() {
  const dialog = useOS((s) => s.dialog)
  const closeDialog = useOS((s) => s.closeDialog)
  if (!dialog) return null

  return (
    <div className="dialog-layer" onMouseDown={closeDialog}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dialog-body">
          <div className="dialog-icon">{dialog.icon || '☺'}</div>
          <div>
            {dialog.title && <div className="dialog-title">{dialog.title}</div>}
            <div className="dialog-text">{dialog.body}</div>
          </div>
        </div>
        <div className="dialog-buttons">
          <button className="btn dialog-ok" onClick={closeDialog}>OK</button>
        </div>
      </div>
    </div>
  )
}
