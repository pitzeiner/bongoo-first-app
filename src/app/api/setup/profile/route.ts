import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  logoUrl: z.string().url().optional().nullable(),
})

export async function POST(request: NextRequest) {
  // Authentifizierung via Session-Cookie
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
  }

  const { name, description, logoUrl } = parsed.data

  // Profil über anon-Client lesen (RLS erlaubt eigenes Profil)
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  // Profil muss existieren UND Admin-Rolle haben (BUG-10: null-Profile blockieren)
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  if (profile.organization_id) {
    // UPDATE bestehende Organisation mit User-Client (RLS erzwingt Mandantentrennung)
    const updateData: Record<string, string> = { name, description: description ?? '' }
    if (logoUrl) updateData.logo_url = logoUrl

    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', profile.organization_id)

    if (error) {
      return NextResponse.json({ error: 'Profil konnte nicht gespeichert werden' }, { status: 500 })
    }

    return NextResponse.json({ organizationId: profile.organization_id })
  } else {
    // INSERT neue Organisation — Admin-Client nötig (Bootstrapping: User hat noch keine org_id,
    // daher greift RLS-Policy auf organizations noch nicht)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Server nicht konfiguriert' }, { status: 500 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({ name, description: description ?? '', ...(logoUrl ? { logo_url: logoUrl } : {}) })
      .select('id')
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organisation konnte nicht erstellt werden' }, { status: 500 })
    }

    // Eigenes Profil verknüpfen — User-Client kann eigene Profilzeile updaten
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ organization_id: org.id })
      .eq('id', user.id)

    if (profileError) {
      return NextResponse.json({ error: 'Profil konnte nicht verknüpft werden' }, { status: 500 })
    }

    return NextResponse.json({ organizationId: org.id })
  }
}
