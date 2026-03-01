import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { UsersPageClient } from './UsersPageClient'

export default async function UsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Rolle des aktuellen Nutzers prüfen
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const isAdmin = currentProfile?.role === 'admin'
  const organizationId = currentProfile?.organization_id

  let users: Array<{
    id: string
    display_name: string
    email: string
    role: 'admin' | 'setup_user'
    status: 'active' | 'suspended'
  }> = []

  if (organizationId) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name, role, status')
      .eq('organization_id', organizationId)
      .order('role', { ascending: true })

    if (profilesData && profilesData.length > 0) {
      // Nur Emails der Org-eigenen User laden (getUserById statt listUsers über alle Vereine)
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      const emailResults = await Promise.all(
        profilesData.map((p) => admin.auth.admin.getUserById(p.id))
      )
      const emailMap = new Map(
        emailResults
          .filter((r) => !r.error && r.data.user)
          .map((r) => [r.data.user!.id, r.data.user!.email ?? ''])
      )

      users = profilesData.map((p) => {
        const email = emailMap.get(p.id) ?? ''
        return {
          id: p.id,
          display_name: p.display_name ?? email.split('@')[0] ?? 'Unbekannt',
          email,
          role: p.role as 'admin' | 'setup_user',
          status: (p.status as 'active' | 'suspended') ?? 'active',
        }
      })
    }
  }

  return (
    <UsersPageClient
      users={users}
      currentUserId={user.id}
      isAdmin={isAdmin ?? false}
    />
  )
}
