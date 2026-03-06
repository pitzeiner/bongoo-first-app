'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ActivateConfirmDialog } from '@/components/setup/events/ActivateConfirmDialog'
import { DeleteConfirmDialog } from '@/components/setup/events/DeleteConfirmDialog'

interface EventActionsPanelProps {
  eventId: string
  eventName: string
  status: 'draft' | 'active' | 'archived'
  activeEventName: string | null
}

export function EventActionsPanel({ eventId, eventName, status, activeEventName }: EventActionsPanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activateDialog, setActivateDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)

  async function performAction(url: string, method: string) {
    setLoading(true)
    try {
      const res = await fetch(url, { method })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Aktion fehlgeschlagen')
        return
      }
      router.push('/setup/events')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (status === 'archived') return null

  return (
    <div className="space-y-4">
      {/* Status-Aktionen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status-Aktionen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {status === 'draft' && (
            <Button
              onClick={() => {
                // Dialog nur zeigen, wenn ein anderes Event bereits aktiv ist
                if (activeEventName) {
                  setActivateDialog(true)
                } else {
                  performAction(`/api/setup/events/${eventId}/activate`, 'POST')
                }
              }}
              disabled={loading}
            >
              Fest aktivieren
            </Button>
          )}
          {status === 'active' && (
            <Button
              variant="outline"
              onClick={() => performAction(`/api/setup/events/${eventId}/activate`, 'POST')}
              disabled={loading}
            >
              Deaktivieren (→ Entwurf)
            </Button>
          )}
          {(status === 'draft' || status === 'active') && (
            <Button
              variant="outline"
              onClick={() => performAction(`/api/setup/events/${eventId}/archive`, 'POST')}
              disabled={loading}
            >
              Archivieren
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Gefahrenzone */}
      {status === 'draft' && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Gefahrenzone</CardTitle>
            <CardDescription>
              Diese Aktionen können nicht rückgängig gemacht werden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Fest löschen</p>
                <p className="text-xs text-muted-foreground">
                  Nur Entwürfe können gelöscht werden.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialog(true)}
                disabled={loading}
              >
                Löschen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ActivateConfirmDialog
        open={activateDialog}
        activeEventName={activeEventName ?? ''}
        onConfirm={async () => {
          setActivateDialog(false)
          await performAction(`/api/setup/events/${eventId}/activate`, 'POST')
        }}
        onCancel={() => setActivateDialog(false)}
      />

      <DeleteConfirmDialog
        open={deleteDialog}
        eventName={eventName}
        onConfirm={async () => {
          setDeleteDialog(false)
          await performAction(`/api/setup/events/${eventId}`, 'DELETE')
        }}
        onCancel={() => setDeleteDialog(false)}
      />
    </div>
  )
}
