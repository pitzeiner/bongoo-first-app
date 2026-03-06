'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
import { type Category } from '@/lib/articles-types'
import { cn } from '@/lib/utils'

interface CategoryListProps {
  categories: Category[]
  selectedCategoryId: string | null
  onSelect: (id: string | null) => void
  onAdd: () => void
  onEdit: (category: Category) => void
  onDeleted: () => void
}

export function CategoryList({
  categories,
  selectedCategoryId,
  onSelect,
  onAdd,
  onEdit,
  onDeleted,
}: CategoryListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/setup/categories/${deleteTarget.id}`, {
        method: 'DELETE',
      })
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Kategorien
        </h3>
        <Button variant="ghost" size="sm" onClick={onAdd} aria-label="Kategorie hinzufuegen">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Noch keine Kategorien angelegt.
        </p>
      )}

      <button
        onClick={() => onSelect(null)}
        className={cn(
          'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
          selectedCategoryId === null
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
        )}
      >
        Alle Artikel
      </button>

      {categories.map((cat) => (
        <div
          key={cat.id}
          className={cn(
            'group flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer',
            selectedCategoryId === cat.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
          )}
          onClick={() => onSelect(cat.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelect(cat.id)
          }}
        >
          {cat.color && (
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: cat.color }}
              aria-hidden="true"
            />
          )}
          <span className="flex-1 truncate font-medium">{cat.name}</span>
          <Badge variant="secondary" className="text-xs tabular-nums">
            {cat.display_order}
          </Badge>
          <div className="hidden group-hover:flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(cat)
              }}
              className={cn(
                'p-1 rounded hover:bg-gray-200',
                selectedCategoryId === cat.id && 'hover:bg-primary-foreground/20'
              )}
              aria-label={`${cat.name} bearbeiten`}
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeleteTarget(cat)
              }}
              className={cn(
                'p-1 rounded hover:bg-destructive/10 hover:text-destructive',
                selectedCategoryId === cat.id && 'hover:bg-primary-foreground/20'
              )}
              aria-label={`${cat.name} loeschen`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategorie loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du die Kategorie &quot;{deleteTarget?.name}&quot;
              loeschen moechtest? Artikel in dieser Kategorie werden nicht geloescht,
              verlieren aber ihre Zuordnung.
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
    </div>
  )
}
