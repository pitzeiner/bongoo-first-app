'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'
import { type Category, type Product } from '@/lib/articles-types'
import { EventProductsTable } from './EventProductsTable'
import { EventProductFormDialog } from './EventProductFormDialog'

interface Station {
  id: string
  name: string
}

interface EventProductsPanelProps {
  eventId: string
}

export function EventProductsPanel({ eventId }: EventProductsPanelProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedTab, setSelectedTab] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [catRes, prodRes, stationRes] = await Promise.all([
        fetch('/api/setup/categories'),
        fetch(`/api/setup/events/${eventId}/products`),
        // Stations from PROJ-4 - try to load, fallback to empty
        fetch(`/api/setup/events/${eventId}/stations`).catch(() => null),
      ])
      if (!catRes.ok || !prodRes.ok) {
        throw new Error('Daten konnten nicht geladen werden')
      }
      const catData = await catRes.json()
      const prodData = await prodRes.json()
      setCategories(catData.categories ?? [])
      setProducts(prodData.products ?? [])

      if (stationRes && stationRes.ok) {
        const stationData = await stationRes.json()
        setStations(stationData.stations ?? [])
      } else {
        setStations([])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const sortedCategories = [...categories].sort(
    (a, b) => a.display_order - b.display_order
  )

  const filteredProducts =
    selectedTab === 'all'
      ? products
      : products.filter((p) => p.category_id === selectedTab)

  const sortedProducts = [...filteredProducts].sort(
    (a, b) => a.display_order - b.display_order
  )

  const nextProductOrder =
    products.length > 0
      ? Math.max(...products.map((p) => p.display_order)) + 1
      : 0

  // Count products per category for tabs
  const productCountByCategory = new Map<string, number>()
  for (const p of products) {
    productCountByCategory.set(
      p.category_id,
      (productCountByCategory.get(p.category_id) ?? 0) + 1
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Artikel ({products.length})
            </CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditProduct(null)
                setDialogOpen(true)
              }}
              disabled={categories.length === 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              Artikel
            </Button>
          </div>
          {categories.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">
              Es sind noch keine Kategorien vorhanden. Erstelle zuerst
              Kategorien unter &quot;Artikel &amp; Kategorien&quot; in der
              Seitenleiste.
            </p>
          )}
          {stations.length === 0 && categories.length > 0 && (
            <p className="text-sm text-amber-600 mt-2">
              Noch keine Stationen konfiguriert. Stationen werden fuer die
              Zuweisung an Artikel benoetigt (PROJ-4).
            </p>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            {sortedCategories.length > 0 && (
              <TabsList className="mb-4 flex-wrap h-auto gap-1">
                <TabsTrigger value="all">
                  Alle ({products.length})
                </TabsTrigger>
                {sortedCategories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-1.5">
                      {cat.color && (
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                      {cat.name} ({productCountByCategory.get(cat.id) ?? 0})
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            )}

            <TabsContent value={selectedTab} forceMount>
              <EventProductsTable
                products={sortedProducts}
                categories={categories}
                stations={stations}
                eventId={eventId}
                onEdit={(product) => {
                  setEditProduct(product)
                  setDialogOpen(true)
                }}
                onRefresh={fetchData}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <EventProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editProduct}
        categories={categories}
        stations={stations}
        eventId={eventId}
        nextOrder={nextProductOrder}
        defaultCategoryId={selectedTab !== 'all' ? selectedTab : null}
        onSave={fetchData}
      />
    </>
  )
}
