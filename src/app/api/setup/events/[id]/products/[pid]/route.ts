import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const updateSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  category_id: z.string().uuid().optional(),
  unit: z.enum(['Stk.', 'l', 'kg']).optional(),
  price_cents: z.number().int().min(0).optional(),
  station_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
  image_url: z.string().url().nullable().optional(),
})

async function resolveProduct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  eventId: string,
  productId: string
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', userId)
    .single()

  if (!profile?.organization_id) return { profile: null, event: null, product: null }

  const { data: event } = await supabase
    .from('events')
    .select('id, organization_id, status')
    .eq('id', eventId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!event) return { profile, event: null, product: null }

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('event_id', eventId)
    .single()

  return { profile, event, product }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const { id, pid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  if (!checkRateLimit(`products:update:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen.' }, { status: 429 })
  }

  const { profile, event, product } = await resolveProduct(supabase, user.id, id, pid)
  if (!product) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (event?.status === 'archived') {
    return NextResponse.json({ error: 'Archivierte Feste können nicht bearbeitet werden' }, { status: 409 })
  }

  const body = await request.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const { error } = await supabase
    .from('products')
    .update(parsed.data)
    .eq('id', pid)

  if (error) return NextResponse.json({ error: 'Aktualisierung fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const { id, pid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  if (!checkRateLimit(`products:delete:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen.' }, { status: 429 })
  }

  const { profile, event, product } = await resolveProduct(supabase, user.id, id, pid)
  if (!product) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (event?.status === 'archived') {
    return NextResponse.json({ error: 'Archivierte Feste können nicht bearbeitet werden' }, { status: 409 })
  }

  const { error } = await supabase.from('products').delete().eq('id', pid)
  if (error) return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ success: true })
}
