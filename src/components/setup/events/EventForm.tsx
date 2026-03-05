'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'

const eventSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  date: z.date().refine((d) => !!d, 'Datum ist erforderlich'),
  end_date: z.date().optional(),
  location: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
}).refine(
  (d) => !d.end_date || d.end_date >= d.date,
  { message: 'End-Datum muss nach oder gleich dem Start-Datum sein', path: ['end_date'] }
)

export type EventFormValues = z.infer<typeof eventSchema>

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>
  eventId?: string
  readOnly?: boolean
  onSuccess?: () => void
}

export function EventForm({ defaultValues, eventId, readOnly = false, onSuccess }: EventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      location: '',
      description: '',
      ...defaultValues,
    },
  })

  async function onSubmit(values: EventFormValues) {
    setLoading(true)
    setError(null)
    try {
      const url = eventId ? `/api/setup/events/${eventId}` : '/api/setup/events'
      const method = eventId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          date: format(values.date, 'yyyy-MM-dd'),
          end_date: values.end_date ? format(values.end_date, 'yyyy-MM-dd') : null,
          location: values.location ?? '',
          description: values.description ?? '',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Speichern fehlgeschlagen')
      }
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/setup/events')
        router.refresh()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="z. B. Maifest 2026" disabled={readOnly} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => {
              const isPast = field.value && field.value < new Date(new Date().toDateString())
              return (
                <FormItem className="flex flex-col">
                  <FormLabel>Start-Datum *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          disabled={readOnly}
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP', { locale: de }) : 'Datum auswählen'}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={de}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {isPast && !readOnly && (
                    <p className="text-sm text-amber-600">
                      Hinweis: Das gewählte Datum liegt in der Vergangenheit.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End-Datum <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        disabled={readOnly}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP', { locale: de }) : 'Mehrtägig?'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const start = form.getValues('date')
                        return start ? date < start : false
                      }}
                      locale={de}
                      initialFocus
                    />
                    {field.value && !readOnly && (
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-muted-foreground"
                          onClick={() => field.onChange(undefined)}
                        >
                          End-Datum entfernen
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ort</FormLabel>
              <FormControl>
                <Input placeholder="z. B. Vereinsgelände" disabled={readOnly} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optionale Beschreibung..."
                  rows={3}
                  disabled={readOnly}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!readOnly && (
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern…' : 'Speichern'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/setup/events')}
              disabled={loading}
            >
              Abbrechen
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
