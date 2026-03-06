import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const createSchema = z.object({
  name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .max(40, 'Maximal 40 Zeichen (Bon-Druck-Limit)'),
  category_id: z.string().uuid(),
  unit: z.enum(['Stk.', 'l', 'kg']),
  price_cents: z.number().int().min(0, 'Preis darf nicht negativ sein'),
  station_id: z.string().uuid('Station ist erforderlich'),
  display_order: z.number().int().min(0),
  template_id: z.string().uuid().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
})

async function resolveEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  eventId: string
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', userId)
    .single()

  if (!profile?.organization_id) return { profile: null, event: null }

  const { data: event } = await supabase
    .from('events')
    .select('id, organization_id, status')
    .eq('id', eventId)
    .eq('organization_id', profile.organization_id)
    .single()

  return { profile, event }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { event } = await resolveEvent(supabase, user.id, id)
  if (!event) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('event_id', id)
    .order('display_order', { ascending: true })
    .limit(500)

  if (error) return NextResponse.json({ error: 'Laden fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ products })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  if (!checkRateLimit(`products:create:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' }, { status: 429 })
  }

  const { profile, event } = await resolveEvent(supabase, user.id, id)
  if (!event) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (event.status === 'archived') {
    return NextResponse.json({ error: 'Archivierte Feste können nicht bearbeitet werden' }, { status: 409 })
  }

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const { error, data } = await supabase
    .from('products')
    .insert({ ...parsed.data, event_id: id, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Erstellen fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ product: data }, { status: 201 })
}
