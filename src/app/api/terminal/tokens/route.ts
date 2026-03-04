import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SignJWT } from 'jose'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const schema = z.object({
  terminalName: z.string().min(1).max(100),
  terminalRole: z.enum(['kassa', 'ausgabe', 'kellner']),
  expiresInHours: z.number().int().min(1).max(72).default(12),
  eventId: z.string().uuid().optional(),
})

function getJwtSecret(): Uint8Array {
  const secret = process.env.QR_TOKEN_SECRET
  if (!secret) throw new Error('QR_TOKEN_SECRET nicht konfiguriert')
  return new TextEncoder().encode(secret)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  // Aktive Mitglieder der Organisation dürfen Tokens generieren
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'active' || !profile.organization_id) {
    return NextResponse.json({ error: 'Keine Berechtigung oder kein Vereinsprofil' }, { status: 403 })
  }

  // Rate Limit: max. 20 Token-Generierungen pro Stunde pro Organisation
  if (!checkRateLimit(`tokens:${profile.organization_id}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte warten Sie kurz.' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
  }

  const { terminalName, terminalRole, expiresInHours, eventId } = parsed.data

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expiresInHours)

  // Terminal-Token in DB speichern (gibt jti zurück)
  const { data: tokenRecord, error: dbError } = await supabase
    .from('terminal_tokens')
    .insert({
      organization_id: profile.organization_id,
      created_by: user.id,
      terminal_role: terminalRole,
      terminal_name: terminalName,
      expires_at: expiresAt.toISOString(),
      jti: crypto.randomUUID(),
      ...(eventId && { event_id: eventId }),
    })
    .select('id, jti')
    .single()

  if (dbError || !tokenRecord) {
    return NextResponse.json({ error: 'Token konnte nicht erstellt werden' }, { status: 500 })
  }

  // JWT signieren
  let secret: Uint8Array
  try {
    secret = getJwtSecret()
  } catch {
    return NextResponse.json({ error: 'Server nicht konfiguriert (QR_TOKEN_SECRET fehlt)' }, { status: 500 })
  }

  const jwt = await new SignJWT({
    organizationId: profile.organization_id,
    terminalRole,
    terminalName,
    tokenId: tokenRecord.id,
    ...(eventId && { eventId }),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(tokenRecord.jti)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret)

  const activationUrl = `${new URL(request.url).origin}/terminal/activate?token=${jwt}`

  // QR-Code als Base64 Data-URL generieren
  const qrDataUrl = await QRCode.toDataURL(activationUrl, { width: 300, margin: 2 })

  return NextResponse.json({
    token: jwt,
    activationUrl,
    qrDataUrl,
    expiresAt: expiresAt.toISOString(),
    tokenId: tokenRecord.id,
  })
}

// GET: Alle Tokens der eigenen Organisation auflisten
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'active' || !profile.organization_id) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const { data: tokens, error } = await supabase
    .from('terminal_tokens')
    .select('id, terminal_name, terminal_role, expires_at, is_revoked, created_at')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: 'Tokens konnten nicht geladen werden' }, { status: 500 })
  }

  return NextResponse.json({ tokens })
}
