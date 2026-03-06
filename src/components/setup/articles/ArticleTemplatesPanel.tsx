'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'
import { type Category, type ProductTemplate } from '@/lib/articles-types'
import { CategoryList } from './CategoryList'
import { CategoryFormDialog } from './CategoryFormDialog'
import { TemplatesTable } from './TemplatesTable'
import { TemplateFormDialog } from './TemplateFormDialog'

export function ArticleTemplatesPanel() {
  const [categories, setCategories] = useState<Category[]>([])
  const [templates, setTemplates] = useState<ProductTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Category state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)

  // Template state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [editTemplate, setEditTemplate] = useState<ProductTemplate | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [catRes, tplRes] = await Promise.all([
        fetch('/api/setup/categories'),
        fetch('/api/setup/product-templates'),
      ])
      if (!catRes.ok || !tplRes.ok) {
        throw new Error('Daten konnten nicht geladen werden')
      }
      const catData = await catRes.json()
      const tplData = await tplRes.json()
      setCategories(catData.categories ?? [])
      setTemplates(tplData.templates ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredTemplates = selectedCategoryId
    ? templates.filter((t) => t.category_id === selectedCategoryId)
    : templates

  const sortedTemplates = [...filteredTemplates].sort(
    (a, b) => a.display_order - b.display_order
  )

  const sortedCategories = [...categories].sort(
    (a, b) => a.display_order - b.display_order
  )

  const nextCategoryOrder =
    categories.length > 0
      ? Math.max(...categories.map((c) => c.display_order)) + 1
      : 0

  const nextTemplateOrder =
    templates.length > 0
      ? Math.max(...templates.map((t) => t.display_order)) + 1
      : 0

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchData}>
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Left: Categories Panel */}
        <Card className="h-fit">
          <CardContent className="pt-6">
            <CategoryList
              categories={sortedCategories}
              selectedCategoryId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              onAdd={() => {
                setEditCategory(null)
                setCategoryDialogOpen(true)
              }}
              onEdit={(cat) => {
                setEditCategory(cat)
                setCategoryDialogOpen(true)
              }}
              onDeleted={fetchData}
            />
          </CardContent>
        </Card>

        {/* Right: Templates Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Artikelvorlagen
                {selectedCategoryId && (
                  <span className="text-muted-foreground font-normal ml-2 text-sm">
                    ({sortedTemplates.length})
                  </span>
                )}
              </CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditTemplate(null)
                  setTemplateDialogOpen(true)
                }}
                disabled={categories.length === 0}
              >
                <Plus className="h-4 w-4 mr-1" />
                Vorlage
              </Button>
            </div>
            {categories.length === 0 && (
              <p className="text-sm text-amber-600 mt-2">
                Erstelle zuerst eine Kategorie, bevor du Artikelvorlagen anlegen
                kannst.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <TemplatesTable
              templates={sortedTemplates}
              categories={categories}
              onEdit={(tpl) => {
                setEditTemplate(tpl)
                setTemplateDialogOpen(true)
              }}
              onDeleted={fetchData}
            />
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CategoryFormDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editCategory}
        nextOrder={nextCategoryOrder}
        onSave={fetchData}
      />

      <TemplateFormDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        template={editTemplate}
        categories={categories}
        nextOrder={nextTemplateOrder}
        defaultCategoryId={selectedCategoryId}
        onSave={fetchData}
      />
    </>
  )
}
