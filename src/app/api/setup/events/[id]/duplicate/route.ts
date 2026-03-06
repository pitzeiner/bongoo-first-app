import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const schema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).refine(
  (d) => !d.end_date || d.end_date >= d.date,
  { message: 'End-Datum muss nach oder gleich dem Start-Datum sein', path: ['end_date'] }
)

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  if (!checkRateLimit(`events:duplicate:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' }, { status: 429 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const { data: source } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!source) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const { data: copy, error } = await supabase
    .from('events')
    .insert({
      organization_id: profile.organization_id,
      name: parsed.data.name,
      date: parsed.data.date,
      end_date: parsed.data.end_date ?? null,
      location: source.location ?? '',
      description: source.description ?? '',
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Duplizieren fehlgeschlagen' }, { status: 500 })

  // Artikel vom Quell-Fest ins neue Fest kopieren
  const { data: sourceProducts } = await supabase
    .from('products')
    .select('*')
    .eq('event_id', id)

  if (sourceProducts && sourceProducts.length > 0) {
    const copies = sourceProducts.map((p) => ({
      event_id: copy.id,
      template_id: p.template_id,
      category_id: p.category_id,
      name: p.name,
      unit: p.unit,
      price_cents: p.price_cents,
      last_price_cents: p.price_cents,
      station_id: p.station_id,
      is_active: true,
      display_order: p.display_order,
      image_url: p.image_url,
    }))
    await supabase.from('products').insert(copies)
  }

  return NextResponse.json({ event: copy }, { status: 201 })
}
