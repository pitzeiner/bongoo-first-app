import { createClient } from '@/lib/supabase-server'
import { OrganizationProfileForm } from '@/components/setup/OrganizationProfileForm'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShieldAlert } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Rolle und Vereinsprofil in einem Query laden
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, organizations(id, name, description, logo_url)')
    .eq('id', user?.id ?? '')
    .single()

  // Nur Admins dürfen das Vereinsprofil verwalten (serverseitige Prüfung)
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vereinsprofil</h1>
        </div>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Keine Berechtigung</AlertTitle>
          <AlertDescription>
            Nur Vereins-Admins dürfen das Vereinsprofil verwalten. Wenden Sie sich an Ihren Admin.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const organization = (profile as any)?.organizations ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vereinsprofil</h1>
        <p className="text-muted-foreground">
          Verwalten Sie die Informationen Ihres Vereins
        </p>
      </div>
      <OrganizationProfileForm initialData={organization} />
    </div>
  )
}
