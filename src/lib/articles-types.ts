/**
 * Shared types for PROJ-3: Artikel- & Kategorieverwaltung
 */

export interface Category {
  id: string
  organization_id: string
  name: string
  color: string | null
  display_order: number
  created_at: string
}

export interface ProductTemplate {
  id: string
  organization_id: string
  category_id: string
  name: string
  unit: 'Stk.' | 'l' | 'kg'
  image_url: string | null
  display_order: number
  created_at: string
}

export interface Product {
  id: string
  event_id: string
  template_id: string | null
  category_id: string | null
  name: string
  unit: 'Stk.' | 'l' | 'kg'
  price_cents: number
  last_price_cents: number | null
  station_id: string | null
  is_active: boolean
  display_order: number
  image_url: string | null
  created_at: string
}

export const UNIT_OPTIONS = [
  { value: 'Stk.', label: 'Stk.' },
  { value: 'l', label: 'Liter' },
  { value: 'kg', label: 'Kilogramm' },
] as const

export const CATEGORY_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
] as const

/**
 * Format cents to Euro string (e.g. 350 -> "3,50")
 */
export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

/**
 * Parse Euro string to cents (e.g. "3,50" -> 350)
 * Returns null if invalid
 */
export function parseCents(value: string): number | null {
  const cleaned = value.replace(',', '.').trim()
  const num = parseFloat(cleaned)
  if (isNaN(num) || num < 0) return null
  return Math.round(num * 100)
}
