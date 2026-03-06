'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { type ProductTemplate, type Category } from '@/lib/articles-types'

interface TemplatesTableProps {
  templates: ProductTemplate[]
  categories: Category[]
  onEdit: (template: ProductTemplate) => void
  onDeleted: () => void
}

export function TemplatesTable({
  templates,
  categories,
  onEdit,
  onDeleted,
}: TemplatesTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<ProductTemplate | null>(null)
  const [deleting, setDeleting] = useState(false)

  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/setup/product-templates/${deleteTarget.id}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Loeschen fehlgeschlagen')
        return
      }
      setDeleteTarget(null)
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Noch keine Artikelvorlagen angelegt.</p>
        <p className="text-xs mt-1">
          Erstelle deine erste Vorlage mit dem Button oben.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Kategorie</TableHead>
              <TableHead className="hidden sm:table-cell">Einheit</TableHead>
              <TableHead className="w-20 text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((tpl) => {
              const cat = categoryMap.get(tpl.category_id)
              return (
                <TableRow key={tpl.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {tpl.display_order}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{tpl.name}</span>
                      <div className="sm:hidden mt-0.5">
                        {cat && (
                          <Badge variant="secondary" className="text-xs mr-1">
                            {cat.color && (
                              <span
                                className="h-2 w-2 rounded-full inline-block mr-1"
                                style={{ backgroundColor: cat.color }}
                              />
                            )}
                            {cat.name}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {tpl.unit}
                        </span>
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
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {tpl.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(tpl)}
                        aria-label={`${tpl.name} bearbeiten`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(tpl)}
                        aria-label={`${tpl.name} loeschen`}
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
            <AlertDialogTitle>Artikelvorlage loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du &quot;{deleteTarget?.name}&quot; loeschen
              moechtest? Bereits in Feste kopierte Artikel bleiben davon
              unberuehrt.
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
