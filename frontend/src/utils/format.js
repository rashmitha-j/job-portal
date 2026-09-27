function formatMoney(amount, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

export function formatSalary(salary) {
  const { min, max, currency } = salary || {}
  if (min == null && max == null) return 'Not disclosed'
  if (min != null && max != null) {
    return min === max
      ? `${formatMoney(min, currency)} / year`
      : `${formatMoney(min, currency)} – ${formatMoney(max, currency)} / year`
  }
  if (min != null) return `From ${formatMoney(min, currency)} / year`
  return `Up to ${formatMoney(max, currency)} / year`
}

const years = (n) => `${n} ${n === 1 ? 'yr' : 'yrs'}`

export function formatExperience(experience) {
  const { min = 0, max } = experience || {}
  if (max === 0) return 'Fresher'
  if (max == null) return min === 0 ? 'Any experience' : `${years(min)}+`
  if (min === max) return years(min)
  return `${min}–${years(max)}`
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function timeAgo(value) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  return formatDate(value)
}
