import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EventForm } from '@/components/setup/events/EventForm'

export default async function NewEventPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) redirect('/setup/profile')
  if (profile.role !== 'admin') redirect('/setup/events')

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Neues Fest anlegen</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Erstelle eine neue Veranstaltung für deinen Verein.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Festdetails</CardTitle>
          <CardDescription>Alle Felder außer Ort und Beschreibung sind Pflicht.</CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm />
        </CardContent>
      </Card>
    </div>
  )
}
