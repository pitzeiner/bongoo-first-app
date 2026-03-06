'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const schema = z.object({
  name: z.string().min(1, 'Vereinsname ist ein Pflichtfeld').max(100),
  description: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

interface Organization {
  id: string
  name: string
  description?: string | null
  logo_url?: string | null
}

interface OrganizationProfileFormProps {
  initialData: Organization | null
}

export function OrganizationProfileForm({ initialData }: OrganizationProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo_url ?? null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isCreateMode = !initialData

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
    },
  })

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) validateAndSetFile(file)
  }

  function removeLogo() {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function validateAndSetFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo darf maximal 2 MB groß sein')
      return
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Nur JPG und PNG Dateien sind erlaubt')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSetFile(file)
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return initialData?.logo_url ?? null

    const formData = new FormData()
    formData.append('file', logoFile)

    const response = await fetch('/api/setup/logo-upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      toast.error(data.error ?? 'Logo konnte nicht hochgeladen werden')
      return initialData?.logo_url ?? null
    }

    const { url } = await response.json()
    return url
  }

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const response = await fetch('/api/setup/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          description: values.description ?? '',
          organizationId: initialData?.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error ?? 'Profil konnte nicht gespeichert werden')
        return
      }

      const { organizationId } = await response.json()

      // Logo hochladen und URL in DB speichern
      if (logoFile && organizationId) {
        const logoUrl = await uploadLogo()
        if (logoUrl) {
          await fetch('/api/setup/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: values.name, description: values.description ?? '', organizationId, logoUrl }),
          })
        }
      }

      toast.success(isCreateMode ? 'Vereinsprofil erstellt!' : 'Vereinsprofil aktualisiert!')
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isCreateMode ? 'Vereinsprofil anlegen' : 'Vereinsprofil bearbeiten'}</CardTitle>
        <CardDescription>
          {isCreateMode
            ? 'Legen Sie zunächst das Profil Ihres Vereins an, bevor Sie weitermachen.'
            : 'Änderungen werden sofort für alle Terminals übernommen.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vereinsname *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Sportverein Musterdorf" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Kurze Beschreibung des Vereins (optional)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Maximal 500 Zeichen</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo-Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Logo</label>
              <div className="flex items-start gap-4">
                {logoPreview ? (
                  <div className="relative">
                    <Image
                      src={logoPreview}
                      alt="Vereinslogo"
                      width={80}
                      height={80}
                      className="rounded-md object-cover border"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`h-20 w-20 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className={`h-6 w-6 ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? 'Logo ändern' : 'Logo hochladen'}
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG oder PNG, max. 2 MB</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading
                ? 'Wird gespeichert...'
                : isCreateMode
                  ? 'Profil anlegen'
                  : 'Änderungen speichern'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
