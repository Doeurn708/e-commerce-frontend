export function formatMoney(value: number | string | null | undefined, currency = '$'): string {
  const num = Number(value ?? 0)
  if (Number.isNaN(num)) return `${currency}0`
  return `${currency}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatNumber(value: number | string | null | undefined): string {
  const num = Number(value ?? 0)
  if (Number.isNaN(num)) return '0'
  return num.toLocaleString('en-US')
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return (
    date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' · ' +
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  )
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export type ProductStatus = 'active' | 'inactive'

export function productStatus(stock: number | null | undefined): ProductStatus {
  return Number(stock ?? 0) > 0 ? 'active' : 'inactive'
}