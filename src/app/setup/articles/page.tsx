import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { ArticleTemplatesPanel } from '@/components/setup/articles/ArticleTemplatesPanel'

export default async function ArticlesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) redirect('/setup/profile')
  if (profile.role !== 'admin') redirect('/setup')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Artikel & Kategorien</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Verwalte Artikelvorlagen und Kategorien fuer deinen Verein. Diese
          Vorlagen werden beim Erstellen eines neuen Festes automatisch
          uebernommen.
        </p>
      </div>

      <ArticleTemplatesPanel />
    </div>
  )
}
