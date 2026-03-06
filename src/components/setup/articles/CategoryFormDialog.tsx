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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { type Category, CATEGORY_COLORS } from '@/lib/articles-types'

const categorySchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(50, 'Maximal 50 Zeichen'),
  color: z.string().nullable(),
  display_order: z.number().int().min(0, 'Muss 0 oder groesser sein'),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  nextOrder: number
  onSave: () => void
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  nextOrder,
  onSave,
}: CategoryFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!category

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color: null,
      display_order: nextOrder,
    },
  })

  useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          name: category.name,
          color: category.color,
          display_order: category.display_order,
        })
      } else {
        form.reset({
          name: '',
          color: null,
          display_order: nextOrder,
        })
      }
      setError(null)
    }
  }, [open, category, nextOrder, form])

  async function onSubmit(values: CategoryFormValues) {
    setLoading(true)
    setError(null)
    try {
      const url = isEdit
        ? `/api/setup/categories/${category.id}`
        : '/api/setup/categories'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
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
            {isEdit ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Bearbeite die Kategorie-Details.'
              : 'Erstelle eine neue Kategorie fuer deine Artikel.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="z. B. Getraenke" {...field} />
                  </FormControl>
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

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Farbe{' '}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          'h-8 w-8 rounded-full border-2 transition-all',
                          field.value === color
                            ? 'border-foreground scale-110'
                            : 'border-transparent hover:border-muted-foreground/50'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() =>
                          field.onChange(field.value === color ? null : color)
                        }
                        aria-label={`Farbe ${color}`}
                      />
                    ))}
                  </div>
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
