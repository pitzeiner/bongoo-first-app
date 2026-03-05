import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EventForm } from '@/components/setup/events/EventForm'
import { EventStatusBadge } from '@/components/setup/events/EventStatusBadge'
import { EventActionsPanel } from './EventActionsPanel'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params
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

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!event) notFound()

  // Aktuell aktives Event der Organisation laden (für Aktivierungs-Dialog)
  const { data: activeEvent } = await supabase
    .from('events')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .eq('status', 'active')
    .neq('id', id)
    .maybeSingle()

  const isArchived = event.status === 'archived'
  const isAdmin = profile.role === 'admin'

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">Festdetails bearbeiten</p>
        </div>
        <EventStatusBadge status={event.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Festdetails</CardTitle>
          {isArchived && (
            <CardDescription className="text-amber-600">
              Archivierte Feste können nicht mehr bearbeitet werden.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <EventForm
            eventId={id}
            readOnly={isArchived || !isAdmin}
            defaultValues={{
              name: event.name,
              date: new Date(event.date + 'T00:00:00'),
              end_date: event.end_date ? new Date(event.end_date + 'T00:00:00') : undefined,
              location: event.location ?? '',
              description: event.description ?? '',
            }}
          />
        </CardContent>
      </Card>

      {isAdmin && (
        <EventActionsPanel
          eventId={id}
          eventName={event.name}
          status={event.status}
          activeEventName={activeEvent?.name ?? null}
        />
      )}
    </div>
  )
}
