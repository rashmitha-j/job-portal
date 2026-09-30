// Coloured circle with a company's initials, used where a company has no logo image
// 16 hues ordered so neighbours contrast; darker shades keep white initials readable
const AVATAR_COLORS = [
  '#4f46e5', '#047857', '#c2410c', '#2563eb', '#db2777', '#0f766e', '#b45309', '#7c3aed',
  '#15803d', '#dc2626', '#0369a1', '#c026d3', '#4d7c0f', '#e11d48', '#0e7490', '#a16207',
]

function initials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]
  return letters.toUpperCase()
}

// Same name → same colour on every page
function colorFor(name) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function CompanyAvatar({ name = '', size = 'md' }) {
  return (
    <span className={`company-avatar company-avatar-${size}`} style={{ backgroundColor: colorFor(name) }} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
