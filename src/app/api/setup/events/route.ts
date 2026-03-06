import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  location: z.string().max(200).optional().default(''),
  description: z.string().max(1000).optional().default(''),
}).refine(
  (d) => !d.end_date || d.end_date >= d.date,
  { message: 'End-Datum muss nach oder gleich dem Start-Datum sein', path: ['end_date'] }
)

async function getAdminProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', userId)
    .single()
  return profile
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const profile = await getAdminProfile(supabase, user.id)
  if (!profile?.organization_id) return NextResponse.json({ error: 'Kein Verein' }, { status: 403 })

  const { data, error } = await supabase
    .from('events')
    .select('id, name, date, end_date, location, status, created_at')
    .eq('organization_id', profile.organization_id)
    .order('date', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
  return NextResponse.json({ events: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  if (!checkRateLimit(`events:create:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' }, { status: 429 })
  }

  const profile = await getAdminProfile(supabase, user.id)
  if (!profile?.organization_id || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const { data, error } = await supabase
    .from('events')
    .insert({
      organization_id: profile.organization_id,
      name: parsed.data.name,
      date: parsed.data.date,
      end_date: parsed.data.end_date ?? null,
      location: parsed.data.location,
      description: parsed.data.description,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Erstellen fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ event: data }, { status: 201 })
}
