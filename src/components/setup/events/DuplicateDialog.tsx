'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DuplicateDialogProps {
  open: boolean
  sourceName: string
  onConfirm: (newName: string, date: string) => void
  onCancel: () => void
}

export function DuplicateDialog({ open, sourceName, onConfirm, onCancel }: DuplicateDialogProps) {
  const [name, setName] = useState(`${sourceName} (Kopie)`)
  const [date, setDate] = useState<Date | undefined>(undefined)

  function handleConfirm() {
    if (name.trim() && date) {
      onConfirm(name.trim(), format(date, 'yyyy-MM-dd'))
    }
  }

  const isValid = name.trim().length > 0 && !!date

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fest duplizieren</DialogTitle>
          <DialogDescription>
            Wähle einen Namen und ein Start-Datum für das neue Fest. Metadaten werden kopiert, Bestellungen nicht.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dup-name">Name des neuen Fests *</Label>
            <Input
              id="dup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Start-Datum *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP', { locale: de }) : 'Datum auswählen'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={de}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Duplizieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
