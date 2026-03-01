import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function ExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="rounded-full bg-destructive/10 h-20 w-20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>

        <h1 className="text-2xl font-bold mb-3">QR-Code abgelaufen</h1>

        <p className="text-muted-foreground mb-2">
          Dieser QR-Code ist nicht mehr gültig oder wurde vom Administrator deaktiviert.
        </p>

        <p className="text-muted-foreground mb-8">
          Bitte wenden Sie sich an Ihren Administrator, um einen neuen QR-Code zu erhalten.
        </p>

        <p className="text-sm text-muted-foreground">
          Administratoren können in der{' '}
          <Link href="/setup/users" className="text-primary hover:underline">
            Setup-App
          </Link>{' '}
          neue QR-Codes generieren.
        </p>
      </div>
    </div>
  )
}
