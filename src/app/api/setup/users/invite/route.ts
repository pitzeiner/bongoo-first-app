import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const schema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  // Nur Admins dürfen einladen
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || profile.status !== 'active') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  if (!profile.organization_id) {
    return NextResponse.json({ error: 'Bitte zuerst das Vereinsprofil anlegen' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
  }

  const { displayName, email } = parsed.data

  // Service Role Key legitimerweise erforderlich für:
  // 1. auth.admin.inviteUserByEmail — nur über Admin-API verfügbar
  // 2. profiles.upsert für den eingeladenen User — RLS erlaubt nur eigene Zeilen,
  //    der eingeladene User existiert noch nicht als authentifizierter Kontext
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Server nicht konfiguriert (SUPABASE_SERVICE_ROLE_KEY fehlt)' },
      { status: 500 }
    )
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Magic Link Einladung senden
  const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/callback?next=/auth/update-password` }
  )

  if (inviteError) {
    if (inviteError.message.includes('already been registered')) {
      // Prüfen ob der bestehende User zur eigenen Organisation gehört
      const { data: listData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
      const existingUser = listData?.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      )

      if (existingUser) {
        // RLS-geschützte Abfrage: gibt nur Treffer zurück wenn User in eigener Org ist
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', existingUser.id)
          .single()

        if (existingProfile) {
          // User gehört zur eigenen Org → Passwort-Reset-Link senden (Re-Invite)
          const { error: resetError } = await adminSupabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/callback?next=/auth/update-password`,
          })
          if (!resetError) {
            return NextResponse.json({ success: true, action: 'reset_sent' })
          }
        }
      }

      // User existiert nicht in dieser Org
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse ist bereits in einem anderen Verein registriert' },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Einladung konnte nicht gesendet werden' }, { status: 400 })
  }

  // Profil für den eingeladenen User erstellen (setup_user Rolle)
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .upsert({
      id: inviteData.user.id,
      organization_id: profile.organization_id,
      role: 'setup_user',
      status: 'active',
      display_name: displayName,
    })

  if (profileError) {
    return NextResponse.json({ error: 'Profil konnte nicht erstellt werden' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
