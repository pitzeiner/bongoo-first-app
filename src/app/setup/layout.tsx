import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { SetupSidebar } from '@/components/setup/SetupSidebar'

export default async function SetupLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Nutzerprofil + Rolle laden (graceful fallback wenn Tabelle noch nicht existiert)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'admin'
  const displayName = profile?.display_name ?? user.email ?? 'Benutzer'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SetupSidebar role={role} displayName={displayName} userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="container mx-auto p-6 max-w-4xl">{children}</div>
      </main>
    </div>
  )
}
