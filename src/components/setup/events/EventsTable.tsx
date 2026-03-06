'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { MoreHorizontal } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { EventStatusBadge } from './EventStatusBadge'
import { ActivateConfirmDialog } from './ActivateConfirmDialog'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { DuplicateDialog } from './DuplicateDialog'

export interface EventRow {
  id: string
  name: string
  date: string
  end_date: string | null
  location: string | null
  status: 'draft' | 'active' | 'archived'
}

interface EventsTableProps {
  events: EventRow[]
}

export function EventsTable({ events }: EventsTableProps) {
  const router = useRouter()
  const [activateDialog, setActivateDialog] = useState<{
    eventId: string
    activeEventName: string
  } | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ eventId: string; eventName: string } | null>(
    null
  )
  const [duplicateDialog, setDuplicateDialog] = useState<{
    eventId: string
    eventName: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  async function performAction(url: string, method: string, body?: object) {
    setLoading(true)
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Aktion fehlgeschlagen')
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const activeEvent = events.find((e) => e.status === 'active')

  async function handleActivate(eventId: string) {
    if (activeEvent && activeEvent.id !== eventId) {
      setActivateDialog({ eventId, activeEventName: activeEvent.name })
    } else {
      await performAction(`/api/setup/events/${eventId}/activate`, 'POST')
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Keine Veranstaltungen gefunden.
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Ort</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium">{event.name}</TableCell>
              <TableCell className="whitespace-nowrap">
                {format(new Date(event.date + 'T00:00:00'), 'PP', { locale: de })}
                {event.end_date && (
                  <span className="text-muted-foreground">
                    {' – '}
                    {format(new Date(event.end_date + 'T00:00:00'), 'PP', { locale: de })}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{event.location ?? '—'}</TableCell>
              <TableCell>
                <EventStatusBadge status={event.status} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={loading}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Aktionen</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/setup/events/${event.id}`)}>
                      {event.status === 'archived' ? 'Ansehen' : 'Bearbeiten'}
                    </DropdownMenuItem>
                    {event.status === 'draft' && (
                      <DropdownMenuItem onClick={() => handleActivate(event.id)}>
                        Aktivieren
                      </DropdownMenuItem>
                    )}
                    {event.status === 'active' && (
                      <DropdownMenuItem
                        onClick={() => performAction(`/api/setup/events/${event.id}/activate`, 'POST', { deactivate: true })}
                      >
                        Deaktivieren
                      </DropdownMenuItem>
                    )}
                    {event.status !== 'archived' && (
                      <DropdownMenuItem
                        onClick={() => performAction(`/api/setup/events/${event.id}/archive`, 'POST')}
                      >
                        Archivieren
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => setDuplicateDialog({ eventId: event.id, eventName: event.name })}
                    >
                      Duplizieren
                    </DropdownMenuItem>
                    {event.status === 'draft' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteDialog({ eventId: event.id, eventName: event.name })}
                        >
                          Löschen
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      {activateDialog && (
        <ActivateConfirmDialog
          open
          activeEventName={activateDialog.activeEventName}
          onConfirm={async () => {
            await performAction(`/api/setup/events/${activateDialog.eventId}/activate`, 'POST')
            setActivateDialog(null)
          }}
          onCancel={() => setActivateDialog(null)}
        />
      )}

      {deleteDialog && (
        <DeleteConfirmDialog
          open
          eventName={deleteDialog.eventName}
          onConfirm={async () => {
            await performAction(`/api/setup/events/${deleteDialog.eventId}`, 'DELETE')
            setDeleteDialog(null)
          }}
          onCancel={() => setDeleteDialog(null)}
        />
      )}

      {duplicateDialog && (
        <DuplicateDialog
          open
          sourceName={duplicateDialog.eventName}
          onConfirm={async (newName, date) => {
            await performAction(`/api/setup/events/${duplicateDialog.eventId}/duplicate`, 'POST', { name: newName, date })
            setDuplicateDialog(null)
          }}
          onCancel={() => setDuplicateDialog(null)}
        />
      )}
    </>
  )
}
