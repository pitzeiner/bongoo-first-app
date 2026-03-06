import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Button } from '@/components/ui/button'
import { EventStatusBadge } from '@/components/setup/events/EventStatusBadge'
import { EventProductsPanel } from '@/components/setup/articles/EventProductsPanel'
import { ArrowLeft } from 'lucide-react'

interface EventArticlesPageProps {
  params: Promise<{ id: string }>
}

export default async function EventArticlesPage({ params }: EventArticlesPageProps) {
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
    .select('id, name, status')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!event) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href={`/setup/events/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurueck zum Fest
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Artikel fuer dieses Fest verwalten
            </p>
          </div>
          <EventStatusBadge status={event.status} />
        </div>
      </div>

      <EventProductsPanel eventId={id} />
    </div>
  )
}
