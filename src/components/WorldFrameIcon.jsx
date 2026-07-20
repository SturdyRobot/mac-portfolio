// Desktop/menu icon for WorldFrame — the open-book-with-globe emblem,
// drawn as line art to match the real brand mark.
export default function WorldFrameIcon({ size = 34, color = '#1c2030' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-label="WorldFrame"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      style={{ display: 'block', margin: '0 auto' }}
    >
      {/* open book */}
      <path d="M16 6.2 C12 4.2 7 4.6 5 6.6 L5 25 C8 23 13 23.4 16 25.4 C19 23.4 24 23 27 25 L27 6.6 C25 4.6 20 4.2 16 6.2 Z" />
      {/* center spine */}
      <path d="M16 6.2 L16 25.4" />
      {/* top peak */}
      <path d="M12.8 5 L16 2 L19.2 5" />
      {/* globe */}
      <circle cx="16" cy="15" r="4.4" />
      <path d="M11.6 15 H20.4" />
      <path d="M16 10.6 C13.4 12.6 13.4 17.4 16 19.4" />
      <path d="M16 10.6 C18.6 12.6 18.6 17.4 16 19.4" />
    </svg>
  )
}
