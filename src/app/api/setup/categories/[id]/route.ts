import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().nullable().optional(),
  display_order: z.number().int().min(0).optional(),
})

async function resolveCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  categoryId: string
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', userId)
    .single()

  if (!profile?.organization_id) return { profile: null, category: null }

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .eq('organization_id', profile.organization_id)
    .single()

  return { profile, category }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  if (!checkRateLimit(`categories:update:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen.' }, { status: 429 })
  }

  const { profile, category } = await resolveCategory(supabase, user.id, id)
  if (!category) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const { error } = await supabase
    .from('categories')
    .update(parsed.data)
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Aktualisierung fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  if (!checkRateLimit(`categories:delete:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen.' }, { status: 429 })
  }

  const { profile, category } = await resolveCategory(supabase, user.id, id)
  if (!category) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ success: true })
}
