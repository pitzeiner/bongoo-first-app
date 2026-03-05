'use client'

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

interface ActivateConfirmDialogProps {
  open: boolean
  activeEventName: string
  onConfirm: () => void
  onCancel: () => void
}

export function ActivateConfirmDialog({
  open,
  activeEventName,
  onConfirm,
  onCancel,
}: ActivateConfirmDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Fest aktivieren?</AlertDialogTitle>
          <AlertDialogDescription>
            Das Fest <strong>&ldquo;{activeEventName}&rdquo;</strong> ist derzeit aktiv. Es kann
            immer nur ein Fest gleichzeitig aktiv sein. Das bestehende Fest wird deaktiviert
            (Status: Entwurf).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Trotzdem aktivieren</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
