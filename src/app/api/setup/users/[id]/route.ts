import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const patchSchema = z.object({
  status: z.enum(['active', 'suspended']),
})

type RouteContext = { params: Promise<{ id: string }> }

// PATCH: User sperren / entsperren
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: targetUserId } = await context.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  // Nur Admins dürfen sperren
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, organization_id, status')
    .eq('id', user.id)
    .single()

  if (!currentProfile || currentProfile.role !== 'admin' || currentProfile.status !== 'active') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  // Sich selbst nicht sperren
  if (targetUserId === user.id) {
    return NextResponse.json({ error: 'Sie können sich nicht selbst sperren' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
  }

  // Sicherstellen dass Ziel-User zur selben Organisation gehört und kein Admin ist
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', targetUserId)
    .single()

  if (
    !targetProfile ||
    targetProfile.organization_id !== currentProfile.organization_id ||
    targetProfile.role === 'admin'
  ) {
    return NextResponse.json({ error: 'Benutzer nicht gefunden oder keine Berechtigung' }, { status: 403 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ status: parsed.data.status })
    .eq('id', targetUserId)

  if (error) {
    return NextResponse.json({ error: 'Status konnte nicht geändert werden' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE: User löschen
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: targetUserId } = await context.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  // Nur Admins dürfen löschen
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, organization_id, status')
    .eq('id', user.id)
    .single()

  if (!currentProfile || currentProfile.role !== 'admin' || currentProfile.status !== 'active') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  // Sich selbst nicht löschen
  if (targetUserId === user.id) {
    return NextResponse.json({ error: 'Sie können sich nicht selbst löschen' }, { status: 400 })
  }

  // Sicherstellen dass Ziel-User setup_user ist und zur selben Organisation gehört
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', targetUserId)
    .single()

  if (
    !targetProfile ||
    targetProfile.organization_id !== currentProfile.organization_id ||
    targetProfile.role !== 'setup_user'
  ) {
    return NextResponse.json({ error: 'Benutzer nicht gefunden oder keine Berechtigung' }, { status: 403 })
  }

  // Service Role Key für Auth-User Löschung benötigt
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

  // Auth-User löschen (Profil wird via CASCADE gelöscht)
  const { error } = await adminSupabase.auth.admin.deleteUser(targetUserId)
  if (error) {
    return NextResponse.json({ error: 'Benutzer konnte nicht gelöscht werden' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
