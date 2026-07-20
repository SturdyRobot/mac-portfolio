// Menu/desktop icon for Tamachu — a little pixel electric-mouse face.
export default function PixelPetIcon({ size = 32 }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{ display: 'block', margin: '0 auto' }}
    >
      {/* ears */}
      <rect x="3" y="1" width="2" height="3" fill="#2a2320" />
      <rect x="11" y="1" width="2" height="3" fill="#2a2320" />
      {/* face */}
      <rect x="3" y="4" width="10" height="9" rx="2" fill="#f6c700" stroke="#2a2320" strokeWidth="0.6" />
      {/* eyes */}
      <rect x="5.2" y="7" width="1.6" height="2" fill="#2a2320" />
      <rect x="9.2" y="7" width="1.6" height="2" fill="#2a2320" />
      {/* cheeks */}
      <rect x="3.6" y="9.4" width="2" height="1.6" fill="#ff5b6e" />
      <rect x="10.4" y="9.4" width="2" height="1.6" fill="#ff5b6e" />
    </svg>
  )
}
