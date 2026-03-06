'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { QrCode, Copy, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ROLE_LABELS: Record<string, string> = {
  kassa: 'Kassa-Terminal',
  ausgabe: 'Ausgabe-Terminal (Küche/Bar)',
  kellner: 'Kellner',
}

const schema = z.object({
  terminalName: z.string().min(1, 'Name ist erforderlich').max(100),
  terminalRole: z.enum(['kassa', 'ausgabe', 'kellner']),
  expiresInHours: z.number().int().min(1).max(72),
})

type FormValues = z.infer<typeof schema>

interface QrResult {
  qrDataUrl: string
  activationUrl: string
  terminalName: string
  terminalRole: string
  expiresAt: string
}

export function QrCodeDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [qrResult, setQrResult] = useState<QrResult | null>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      terminalName: '',
      terminalRole: 'kassa',
      expiresInHours: 12,
    },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const response = await fetch('/api/terminal/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error ?? 'QR-Code konnte nicht generiert werden')
        return
      }

      const data = await response.json()
      setQrResult({
        qrDataUrl: data.qrDataUrl,
        activationUrl: data.activationUrl,
        terminalName: values.terminalName,
        terminalRole: values.terminalRole,
        expiresAt: data.expiresAt,
      })
    } finally {
      setLoading(false)
    }
  }

  function handleCopyUrl() {
    if (!qrResult || !urlInputRef.current) return
    urlInputRef.current.select()
    document.execCommand('copy')
    toast.success('Aktivierungs-URL kopiert')
  }

  function handlePrint() {
    if (!qrResult) return
    const win = window.open('', '_blank')
    if (!win) return
    const expiresFormatted = new Date(qrResult.expiresAt).toLocaleString('de-AT')
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-Code: ${qrResult.terminalName}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 2rem; }
            img { width: 250px; height: 250px; }
            h2 { margin: 1rem 0 0.25rem; }
            p { color: #666; font-size: 0.875rem; margin: 0.25rem 0; }
          </style>
        </head>
        <body>
          <img src="${qrResult.qrDataUrl}" alt="QR-Code" />
          <h2>${qrResult.terminalName}</h2>
          <p>${ROLE_LABELS[qrResult.terminalRole] ?? qrResult.terminalRole}</p>
          <p>Gültig bis: ${expiresFormatted}</p>
        </body>
      </html>
    `)
    win.document.close()
    win.print()
  }

  function handleReset() {
    setQrResult(null)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) handleReset() }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <QrCode className="h-4 w-4 mr-2" />
          QR-Code generieren
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR-Code generieren</DialogTitle>
          <DialogDescription>
            Erstellt einen Aktivierungs-QR-Code für ein Terminal oder einen Kellner.
          </DialogDescription>
        </DialogHeader>

        {!qrResult ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="terminalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bezeichnung</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Kassa 1, Küche, Kellner Max" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terminalRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terminal-Typ</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kassa">Kassa-Terminal</SelectItem>
                        <SelectItem value="ausgabe">Ausgabe-Terminal (Küche/Bar)</SelectItem>
                        <SelectItem value="kellner">Kellner</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresInHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gültigkeitsdauer (Stunden)</FormLabel>
                    <FormControl>
                      <Input
                      type="number"
                      min={1}
                      max={72}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Wird generiert...' : 'QR-Code erstellen'}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <img
              src={qrResult.qrDataUrl}
              alt={`QR-Code für ${qrResult.terminalName}`}
              className="w-56 h-56 border rounded-md"
            />
            <div className="text-center">
              <p className="font-semibold">{qrResult.terminalName}</p>
              <p className="text-sm text-muted-foreground">
                {ROLE_LABELS[qrResult.terminalRole] ?? qrResult.terminalRole}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Gültig bis: {new Date(qrResult.expiresAt).toLocaleString('de-AT')}
              </p>
            </div>
            {/* Verstecktes Input innerhalb des Dialogs für execCommand('copy') */}
            <input
              ref={urlInputRef}
              readOnly
              value={qrResult?.activationUrl ?? ''}
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
            />
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={handleCopyUrl}>
                <Copy className="h-4 w-4 mr-2" />
                URL kopieren
              </Button>
              <Button className="flex-1" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Drucken
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset} className="w-full">
              Neuen QR-Code erstellen
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
