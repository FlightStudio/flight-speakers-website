/**
 * Format a single date string (YYYY-MM-DD) for display.
 * Returns e.g. "13 March 2025"
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Format an eventDate value for display.
 * Handles both single dates ("2025-03-15") and
 * pipe-delimited ranges ("2025-03-15|2025-03-20").
 * Returns e.g. "13 March 2025" or "13 March 2025 — 20 March 2025"
 */
export function formatEventDate(value) {
  if (!value) return ''
  if (value.includes('|')) {
    const [start, end] = value.split('|')
    return `${formatDisplayDate(start)} — ${formatDisplayDate(end)}`
  }
  return formatDisplayDate(value)
}
