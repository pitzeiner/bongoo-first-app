import { Badge } from '@/components/ui/badge'

type EventStatus = 'draft' | 'active' | 'archived'

const labels: Record<EventStatus, string> = {
  draft: 'Entwurf',
  active: 'Aktiv',
  archived: 'Archiviert',
}

const variants: Record<EventStatus, 'secondary' | 'default' | 'outline'> = {
  draft: 'secondary',
  active: 'default',
  archived: 'outline',
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}
