import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EventsTable, type EventRow } from '@/components/setup/events/EventsTable'
import { Plus } from 'lucide-react'

export default async function EventsPage() {
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

  const { data: eventsData } = await supabase
    .from('events')
    .select('id, name, date, end_date, location, status')
    .eq('organization_id', profile.organization_id)
    .order('date', { ascending: false })
    .limit(100)

  const events: EventRow[] = (eventsData ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    date: e.date,
    end_date: e.end_date ?? null,
    location: e.location ?? null,
    status: e.status as EventRow['status'],
  }))

  const drafts = events.filter((e) => e.status === 'draft')
  const active = events.filter((e) => e.status === 'active')
  const archived = events.filter((e) => e.status === 'archived')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Veranstaltungen</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Verwalte deine Feste und deren Konfigurationen.
          </p>
        </div>
        {profile.role === 'admin' && (
          <Button asChild>
            <Link href="/setup/events/new">
              <Plus className="h-4 w-4 mr-2" />
              Neues Fest
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Veranstaltungen ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Alle ({events.length})</TabsTrigger>
              <TabsTrigger value="active">Aktiv ({active.length})</TabsTrigger>
              <TabsTrigger value="draft">Entwurf ({drafts.length})</TabsTrigger>
              <TabsTrigger value="archived">Archiviert ({archived.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <EventsTable events={events} />
            </TabsContent>
            <TabsContent value="active">
              <EventsTable events={active} />
            </TabsContent>
            <TabsContent value="draft">
              <EventsTable events={drafts} />
            </TabsContent>
            <TabsContent value="archived">
              <EventsTable events={archived} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
