'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Pencil, Trash2 } from 'lucide-react'
import { type Product, type Category, formatCents } from '@/lib/articles-types'

interface Station {
  id: string
  name: string
}

interface EventProductsTableProps {
  products: Product[]
  categories: Category[]
  stations: Station[]
  eventId: string
  onEdit: (product: Product) => void
  onRefresh: () => void
}

export function EventProductsTable({
  products,
  categories,
  stations,
  eventId,
  onEdit,
  onRefresh,
}: EventProductsTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const stationMap = new Map(stations.map((s) => [s.id, s]))

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/setup/events/${eventId}/products/${deleteTarget.id}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Loeschen fehlgeschlagen')
        return
      }
      setDeleteTarget(null)
      onRefresh()
    } finally {
      setDeleting(false)
    }
  }

  async function handleToggleActive(product: Product) {
    setTogglingIds((prev) => new Set(prev).add(product.id))
    try {
      const res = await fetch(
        `/api/setup/events/${eventId}/products/${product.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...product,
            is_active: !product.is_active,
          }),
        }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Aendern fehlgeschlagen')
        return
      }
      onRefresh()
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Keine Artikel in diesem Fest.</p>
        <p className="text-xs mt-1">
          Artikel werden beim Fest-Erstellen automatisch kopiert oder koennen
          manuell hinzugefuegt werden.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Kategorie</TableHead>
              <TableHead className="text-right">Preis</TableHead>
              <TableHead className="hidden md:table-cell">Station</TableHead>
              <TableHead className="w-16 text-center">Aktiv</TableHead>
              <TableHead className="w-20 text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const cat = categoryMap.get(product.category_id)
              const station = product.station_id
                ? stationMap.get(product.station_id)
                : null

              return (
                <TableRow
                  key={product.id}
                  className={!product.is_active ? 'opacity-50' : ''}
                >
                  <TableCell className="text-muted-foreground tabular-nums">
                    {product.display_order}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{product.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({product.unit})
                      </span>
                      {/* Mobile: show category & station inline */}
                      <div className="sm:hidden mt-0.5 flex flex-wrap gap-1">
                        {cat && (
                          <Badge variant="secondary" className="text-xs">
                            {cat.color && (
                              <span
                                className="h-2 w-2 rounded-full inline-block mr-1"
                                style={{ backgroundColor: cat.color }}
                              />
                            )}
                            {cat.name}
                          </Badge>
                        )}
                        {station && (
                          <Badge variant="outline" className="text-xs">
                            {station.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {cat ? (
                      <Badge variant="secondary" className="text-xs">
                        {cat.color && (
                          <span
                            className="h-2 w-2 rounded-full inline-block mr-1"
                            style={{ backgroundColor: cat.color }}
                          />
                        )}
                        {cat.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <div>
                      <span className="font-medium">
                        {formatCents(product.price_cents)} EUR
                      </span>
                      {product.last_price_cents != null && (
                        <div className="text-xs text-muted-foreground">
                          Zuletzt: {formatCents(product.last_price_cents)} EUR
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {station ? (
                      <Badge variant="outline" className="text-xs">
                        {station.name}
                      </Badge>
                    ) : (
                      <span className="text-amber-600 text-xs">
                        Nicht zugewiesen
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={product.is_active}
                      onCheckedChange={() => handleToggleActive(product)}
                      disabled={togglingIds.has(product.id)}
                      aria-label={
                        product.is_active
                          ? `${product.name} deaktivieren`
                          : `${product.name} aktivieren`
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(product)}
                        aria-label={`${product.name} bearbeiten`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(product)}
                        aria-label={`${product.name} loeschen`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Artikel loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du &quot;{deleteTarget?.name}&quot; aus diesem
              Fest loeschen moechtest?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Loeschen...' : 'Loeschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
