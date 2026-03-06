import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const updateSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  category_id: z.string().uuid().optional(),
  unit: z.enum(['Stk.', 'l', 'kg']).optional(),
  display_order: z.number().int().min(0).optional(),
})

async function resolveTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  templateId: string
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', userId)
    .single()

  if (!profile?.organization_id) return { profile: null, template: null }

  const { data: template } = await supabase
    .from('product_templates')
    .select('*')
    .eq('id', templateId)
    .eq('organization_id', profile.organization_id)
    .single()

  return { profile, template }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  if (!checkRateLimit(`templates:update:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen.' }, { status: 429 })
  }

  const { profile, template } = await resolveTemplate(supabase, user.id, id)
  if (!template) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  // If category_id changed, verify it belongs to same organization
  if (parsed.data.category_id) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('id', parsed.data.category_id)
      .eq('organization_id', profile!.organization_id)
      .single()

    if (!category) return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 404 })
  }

  const { error } = await supabase
    .from('product_templates')
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

  if (!checkRateLimit(`templates:delete:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen.' }, { status: 429 })
  }

  const { profile, template } = await resolveTemplate(supabase, user.id, id)
  if (!template) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const { error } = await supabase.from('product_templates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ success: true })
}
