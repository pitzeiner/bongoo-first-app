import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const createSchema = z.object({
  name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .max(40, 'Maximal 40 Zeichen (Bon-Druck-Limit)'),
  category_id: z.string().uuid('Ungültige Kategorie-ID'),
  unit: z.enum(['Stk.', 'l', 'kg']),
  display_order: z.number().int().min(0),
  image_url: z.string().url().nullable().optional(),
})

async function getAdminProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', userId)
    .single()
  return profile
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const profile = await getAdminProfile(supabase, user.id)
  if (!profile?.organization_id) return NextResponse.json({ error: 'Kein Verein' }, { status: 403 })

  const { data: templates, error } = await supabase
    .from('product_templates')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('display_order', { ascending: true })
    .limit(500)

  if (error) return NextResponse.json({ error: 'Laden fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ templates })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  if (!checkRateLimit(`templates:create:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' }, { status: 429 })
  }

  const profile = await getAdminProfile(supabase, user.id)
  if (!profile?.organization_id) return NextResponse.json({ error: 'Kein Verein' }, { status: 403 })
  if (profile.role !== 'admin') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  // Verify category belongs to same organization
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('id', parsed.data.category_id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!category) return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 404 })

  const { error, data } = await supabase
    .from('product_templates')
    .insert({ ...parsed.data, organization_id: profile.organization_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Erstellen fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ template: data }, { status: 201 })
}
