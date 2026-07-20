// Desktop/menu icon: a tiny BitBoy Color handheld.
// Body is centered on x=12; D-pad (x=7) and buttons (x=17) sit
// symmetrically ±5 from center, Start/Select centered under them.
export default function BitBoyIcon({ size = 34 }) {
  return (
    <svg
      width={size * 0.72}
      height={size}
      viewBox="0 0 24 32"
      aria-label="BitBoy"
      style={{ display: 'block', margin: '0 auto' }}
    >
      <defs>
        <linearGradient id="bbBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#57cccc" />
          <stop offset="1" stopColor="#1c7d84" />
        </linearGradient>
      </defs>

      {/* body */}
      <rect x="1.5" y="1" width="21" height="30" rx="5" fill="url(#bbBody)" stroke="#0c4a50" strokeWidth="0.8" />

      {/* screen housing (centered on x=12) */}
      <rect x="4" y="3.5" width="16" height="12.5" rx="1.6" fill="#20262b" />
      {/* screen */}
      <rect x="5.6" y="5" width="12.8" height="9.5" rx="0.6" fill="#12241a" />
      <rect x="5.6" y="5" width="12.8" height="3.2" rx="0.6" fill="#1b3a29" opacity="0.6" />
      {/* power LED */}
      <circle cx="5.6" cy="18.3" r="0.7" fill="#e0403a" />

      {/* d-pad (centered on x=7, y=23.2) */}
      <rect x="4.3" y="22.35" width="5.4" height="1.7" rx="0.4" fill="#1b1f22" />
      <rect x="6.15" y="20.5" width="1.7" height="5.4" rx="0.4" fill="#1b1f22" />

      {/* A / B buttons (centered on x=17, y=23.2) */}
      <circle cx="18" cy="22" r="1.5" fill="#d84f93" />
      <circle cx="15.8" cy="24.2" r="1.5" fill="#d84f93" />

      {/* start / select (centered on x=12) */}
      <rect x="9" y="27.6" width="2.6" height="0.9" rx="0.45" fill="#1b1f22" />
      <rect x="12.4" y="27.6" width="2.6" height="0.9" rx="0.45" fill="#1b1f22" />
    </svg>
  )
}
