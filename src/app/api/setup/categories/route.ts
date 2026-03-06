import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const createSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(50),
  color: z.string().nullable().optional(),
  display_order: z.number().int().min(0),
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

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('display_order', { ascending: true })
    .limit(200)

  if (error) return NextResponse.json({ error: 'Laden fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ categories })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  if (!checkRateLimit(`categories:create:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' }, { status: 429 })
  }

  const profile = await getAdminProfile(supabase, user.id)
  if (!profile?.organization_id) return NextResponse.json({ error: 'Kein Verein' }, { status: 403 })
  if (profile.role !== 'admin') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const { error, data } = await supabase
    .from('categories')
    .insert({ ...parsed.data, organization_id: profile.organization_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Erstellen fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ category: data }, { status: 201 })
}
