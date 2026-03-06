'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Product, type Category, UNIT_OPTIONS, formatCents } from '@/lib/articles-types'

interface Station {
  id: string
  name: string
}

const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .max(40, 'Maximal 40 Zeichen (Bon-Druck-Limit)'),
  category_id: z.string().min(1, 'Kategorie ist erforderlich'),
  unit: z.enum(['Stk.', 'l', 'kg']),
  price: z.string().min(1, 'Preis ist erforderlich').refine(
    (val) => {
      const cleaned = val.replace(',', '.').trim()
      const num = parseFloat(cleaned)
      return !isNaN(num) && num >= 0
    },
    { message: 'Ungueltiger Preis' }
  ),
  station_id: z.string().min(1, 'Station ist erforderlich'),
  display_order: z.number().int().min(0, 'Muss 0 oder groesser sein'),
})

type ProductFormValues = z.infer<typeof productSchema>

interface EventProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  categories: Category[]
  stations: Station[]
  eventId: string
  nextOrder: number
  defaultCategoryId?: string | null
  onSave: () => void
}

export function EventProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  stations,
  eventId,
  nextOrder,
  defaultCategoryId,
  onSave,
}: EventProductFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!product

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category_id: '',
      unit: 'Stk.',
      price: '',
      station_id: '',
      display_order: nextOrder,
    },
  })

  useEffect(() => {
    if (open) {
      if (product) {
        form.reset({
          name: product.name,
          category_id: product.category_id,
          unit: product.unit,
          price: formatCents(product.price_cents),
          station_id: product.station_id ?? '',
          display_order: product.display_order,
        })
      } else {
        form.reset({
          name: '',
          category_id: defaultCategoryId ?? categories[0]?.id ?? '',
          unit: 'Stk.',
          price: '',
          station_id: stations[0]?.id ?? '',
          display_order: nextOrder,
        })
      }
      setError(null)
    }
  }, [open, product, nextOrder, defaultCategoryId, categories, stations, form])

  async function onSubmit(values: ProductFormValues) {
    setLoading(true)
    setError(null)
    try {
      const priceCents = Math.round(
        parseFloat(values.price.replace(',', '.')) * 100
      )
      const url = isEdit
        ? `/api/setup/events/${eventId}/products/${product.id}`
        : `/api/setup/events/${eventId}/products`
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          category_id: values.category_id,
          unit: values.unit,
          price_cents: priceCents,
          station_id: values.station_id,
          display_order: values.display_order,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Speichern fehlgeschlagen')
      }
      onOpenChange(false)
      onSave()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Artikel bearbeiten' : 'Neuer Artikel'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Bearbeite den Fest-Artikel.'
              : 'Fuege einen neuen Artikel fuer dieses Fest hinzu.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name * (max. 40 Zeichen)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z. B. Bier 0,5l"
                      maxLength={40}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-end">
                    <span className="text-xs text-muted-foreground">
                      {field.value.length}/40
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategorie waehlen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            {cat.color && (
                              <span
                                className="h-2.5 w-2.5 rounded-full inline-block"
                                style={{ backgroundColor: cat.color }}
                              />
                            )}
                            {cat.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Einheit *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preis (EUR) *</FormLabel>
                    <FormControl>
                      <Input placeholder="z. B. 3,50" {...field} />
                    </FormControl>
                    {isEdit && product?.last_price_cents != null && (
                      <FormDescription>
                        Letztes Fest: {formatCents(product.last_price_cents)} EUR
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="station_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Station *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Station waehlen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stations.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          Keine Stationen konfiguriert
                        </SelectItem>
                      ) : (
                        stations.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {stations.length === 0 && (
                    <FormDescription className="text-amber-600">
                      Bitte konfiguriere zuerst Stationen unter Terminal-Setup.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="display_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reihenfolge</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Speichern...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
