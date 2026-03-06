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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type ProductTemplate, type Category, UNIT_OPTIONS } from '@/lib/articles-types'

const templateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .max(40, 'Maximal 40 Zeichen (Bon-Druck-Limit)'),
  category_id: z.string().min(1, 'Kategorie ist erforderlich'),
  unit: z.enum(['Stk.', 'l', 'kg']),
  display_order: z.number().int().min(0, 'Muss 0 oder groesser sein'),
})

type TemplateFormValues = z.infer<typeof templateSchema>

interface TemplateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: ProductTemplate | null
  categories: Category[]
  nextOrder: number
  defaultCategoryId?: string | null
  onSave: () => void
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  categories,
  nextOrder,
  defaultCategoryId,
  onSave,
}: TemplateFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!template

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      category_id: '',
      unit: 'Stk.',
      display_order: nextOrder,
    },
  })

  useEffect(() => {
    if (open) {
      if (template) {
        form.reset({
          name: template.name,
          category_id: template.category_id,
          unit: template.unit,
          display_order: template.display_order,
        })
      } else {
        form.reset({
          name: '',
          category_id: defaultCategoryId ?? categories[0]?.id ?? '',
          unit: 'Stk.',
          display_order: nextOrder,
        })
      }
      setError(null)
    }
  }, [open, template, nextOrder, defaultCategoryId, categories, form])

  async function onSubmit(values: TemplateFormValues) {
    setLoading(true)
    setError(null)
    try {
      const url = isEdit
        ? `/api/setup/product-templates/${template.id}`
        : '/api/setup/product-templates'
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
            {isEdit ? 'Artikelvorlage bearbeiten' : 'Neue Artikelvorlage'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Bearbeite die Artikelvorlage.'
              : 'Erstelle eine neue Artikelvorlage fuer deinen Verein.'}
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
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
            </div>

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
