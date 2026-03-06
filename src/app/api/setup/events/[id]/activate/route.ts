import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  if (!checkRateLimit(`events:activate:${user.id}`, 10, 60_000)) {
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

  // Pruefen, ob das Event zur Organisation gehoert
  const { data: event } = await supabase
    .from('events')
    .select('id, status')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!event) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  if (event.status === 'archived') {
    return NextResponse.json({ error: 'Archivierte Feste können nicht aktiviert werden' }, { status: 409 })
  }

  // Atomare Aktivierung via RPC (deaktiviert andere aktive Events in einer Transaktion)
  const { error } = await supabase.rpc('activate_event', { target_event_id: id })

  if (error) {
    return NextResponse.json(
      { error: event.status === 'active' ? 'Deaktivierung fehlgeschlagen' : 'Aktivierung fehlgeschlagen' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
