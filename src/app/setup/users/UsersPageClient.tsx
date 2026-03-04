'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UserManagementTable } from '@/components/setup/UserManagementTable'
import { InviteUserDialog } from '@/components/setup/InviteUserDialog'
import { QrCodeDialog } from '@/components/setup/QrCodeDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

interface SetupUser {
  id: string
  display_name: string
  email: string
  role: 'admin' | 'setup_user'
  status: 'active' | 'suspended'
}

interface UsersPageClientProps {
  users: SetupUser[]
  currentUserId: string
  isAdmin: boolean
}

export function UsersPageClient({ users, currentUserId, isAdmin }: UsersPageClientProps) {
  const router = useRouter()
  const [localUsers] = useState(users)

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Benutzer</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? 'Verwalten Sie Setup-Benutzer und QR-Code-Zugänge'
              : 'QR-Code-Zugänge für Terminals und Kellner'}
          </p>
        </div>
        <div className="flex gap-2">
          <QrCodeDialog />
          {isAdmin && <InviteUserDialog onInvited={handleRefresh} />}
        </div>
      </div>

      {!isAdmin && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Als Setup-Benutzer können Sie QR-Codes für Terminals und Kellner generieren.
            Die Benutzerverwaltung ist dem Administrator vorbehalten.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <UserManagementTable
            users={localUsers}
            currentUserId={currentUserId}
            onRefresh={handleRefresh}
          />
        </CardContent>
      </Card>
    </div>
  )
}
