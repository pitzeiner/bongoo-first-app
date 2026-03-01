'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function ActivateClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      router.replace('/terminal/expired')
      return
    }

    fetch('/api/terminal/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) {
          router.replace('/terminal/expired')
          return
        }
        const data = await res.json()
        if (data.redirectTo) {
          window.location.href = data.redirectTo
        } else {
          router.replace('/terminal/expired')
        }
      })
      .catch(() => {
        router.replace('/terminal/expired')
      })
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-medium">Zugang wird geprüft...</p>
        <p className="text-sm text-muted-foreground mt-1">Bitte warten Sie einen Moment.</p>
      </div>
    </div>
  )
}
