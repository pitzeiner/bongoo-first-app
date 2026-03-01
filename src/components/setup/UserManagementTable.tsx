'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { MoreHorizontal, ShieldOff, Shield, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface SetupUser {
  id: string
  display_name: string
  email: string
  role: 'admin' | 'setup_user'
  status: 'active' | 'suspended'
}

interface UserManagementTableProps {
  users: SetupUser[]
  currentUserId: string
  onRefresh: () => void
}

export function UserManagementTable({ users, currentUserId, onRefresh }: UserManagementTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<SetupUser | null>(null)

  async function toggleSuspend(user: SetupUser) {
    setLoadingId(user.id)
    try {
      const newStatus = user.status === 'active' ? 'suspended' : 'active'
      const response = await fetch(`/api/setup/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        toast.error('Status konnte nicht geändert werden')
        return
      }

      toast.success(
        newStatus === 'suspended'
          ? `${user.display_name} wurde gesperrt`
          : `${user.display_name} wurde entsperrt`
      )
      onRefresh()
    } finally {
      setLoadingId(null)
    }
  }

  async function deleteUser(user: SetupUser) {
    setLoadingId(user.id)
    try {
      const response = await fetch(`/api/setup/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        toast.error('Benutzer konnte nicht gelöscht werden')
        return
      }

      toast.success(`${user.display_name} wurde gelöscht`)
      setDeleteCandidate(null)
      onRefresh()
    } finally {
      setLoadingId(null)
    }
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Noch keine Setup-Benutzer vorhanden.</p>
        <p className="text-sm">Laden Sie Mitarbeiter über den Button oben ein.</p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead>Rolle</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.display_name}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? 'Admin' : 'Setup-Benutzer'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.status === 'active' ? 'outline' : 'destructive'}>
                  {user.status === 'active' ? 'Aktiv' : 'Gesperrt'}
                </Badge>
              </TableCell>
              <TableCell>
                {user.id !== currentUserId && user.role !== 'admin' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={loadingId === user.id}
                        aria-label="Aktionen"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleSuspend(user)}>
                        {user.status === 'active' ? (
                          <>
                            <ShieldOff className="h-4 w-4 mr-2" />
                            Sperren
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Entsperren
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteCandidate(user)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!deleteCandidate}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benutzer wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCandidate?.display_name} ({deleteCandidate?.email}) wird dauerhaft gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCandidate && deleteUser(deleteCandidate)}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
