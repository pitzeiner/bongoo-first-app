import { Suspense } from 'react'
import { ActivateClient } from './ActivateClient'
import { Loader2 } from 'lucide-react'

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Zugang wird geprüft...</p>
          </div>
        </div>
      }
    >
      <ActivateClient />
    </Suspense>
  )
}
