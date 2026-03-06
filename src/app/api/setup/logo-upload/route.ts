import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || profile.status !== 'active' || !profile.organization_id) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Keine Datei übermittelt' }, { status: 400 })
  }

  // Server-seitige Validierung
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Ungültiger Dateityp. Nur JPG, PNG und WebP sind erlaubt.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'Datei ist zu groß. Maximum: 2 MB.' },
      { status: 400 }
    )
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Server nicht konfiguriert' },
      { status: 500 }
    )
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${profile.organization_id}/logo.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await adminSupabase.storage
    .from('logos')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json(
      { error: 'Logo konnte nicht hochgeladen werden: ' + uploadError.message },
      { status: 500 }
    )
  }

  const { data } = adminSupabase.storage.from('logos').getPublicUrl(path)
  const url = `${data.publicUrl}?t=${Date.now()}`

  return NextResponse.json({ url })
}
