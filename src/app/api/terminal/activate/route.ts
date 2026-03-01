import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { jwtVerify } from 'jose'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const schema = z.object({
  token: z.string().min(1),
})

function getJwtSecret(): Uint8Array {
  const secret = process.env.QR_TOKEN_SECRET
  if (!secret) throw new Error('QR_TOKEN_SECRET nicht konfiguriert')
  return new TextEncoder().encode(secret)
}

// Ziel-URLs je nach Terminal-Rolle
const ROLE_REDIRECT: Record<string, string> = {
  kassa: '/terminal/kassa',
  ausgabe: '/terminal/ausgabe',
  kellner: '/terminal/kellner',
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültiges Token' }, { status: 400 })
  }

  let secret: Uint8Array
  try {
    secret = getJwtSecret()
  } catch {
    return NextResponse.json({ error: 'Server nicht konfiguriert' }, { status: 500 })
  }

  // JWT verifizieren (Signatur + Ablauf)
  let payload: {
    jti?: string
    organizationId?: string
    terminalRole?: string
    terminalName?: string
    tokenId?: string
    eventId?: string
  }
  try {
    const result = await jwtVerify(parsed.data.token, secret, { algorithms: ['HS256'] })
    payload = result.payload as typeof payload
  } catch {
    return NextResponse.json({ error: 'Token ungültig oder abgelaufen' }, { status: 401 })
  }

  if (!payload.jti || !payload.organizationId || !payload.terminalRole || !payload.tokenId) {
    return NextResponse.json({ error: 'Token ungültig' }, { status: 401 })
  }

  // Service Role für sicheres Lesen ohne RLS-Kontext (kein eingeloggter User)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Server nicht konfiguriert' }, { status: 500 })
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Token in DB prüfen (nicht widerrufen, noch nicht abgelaufen)
  const { data: tokenRecord } = await adminSupabase
    .from('terminal_tokens')
    .select('id, is_revoked, expires_at, terminal_role, organization_id')
    .eq('id', payload.tokenId)
    .eq('jti', payload.jti)
    .single()

  if (!tokenRecord || tokenRecord.is_revoked) {
    return NextResponse.json({ error: 'Token nicht gefunden oder widerrufen' }, { status: 401 })
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Token abgelaufen' }, { status: 401 })
  }

  const redirectTo = ROLE_REDIRECT[tokenRecord.terminal_role] ?? '/terminal/expired'
  const appUrl = new URL(request.url).origin

  return NextResponse.json({ redirectTo: `${appUrl}${redirectTo}` })
}
