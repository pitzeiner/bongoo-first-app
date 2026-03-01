'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2 } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
})

type FormValues = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="mb-2">
          <span className="text-2xl font-bold tracking-tight">BonGoo</span>
        </div>
        <CardTitle className="text-2xl">Passwort zurücksetzen</CardTitle>
        <CardDescription>
          Geben Sie Ihre E-Mail-Adresse ein, um einen Reset-Link zu erhalten
        </CardDescription>
      </CardHeader>

      <CardContent>
        {success ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Wir haben Ihnen einen Link zum Zurücksetzen Ihres Passworts gesendet. Bitte überprüfen
              Sie Ihr E-Mail-Postfach.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="verein@beispiel.at" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Link wird gesendet...' : 'Reset-Link senden'}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
        <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-primary">
          ← Zurück zum Login
        </Link>
      </CardFooter>
    </Card>
  )
}
