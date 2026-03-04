'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Bitte Passwort eingeben'),
})

type FormValues = z.infer<typeof schema>

const ERROR_MESSAGES: Record<string, string> = {
  account_suspended:
    'Ihr Konto wurde gesperrt. Bitte wenden Sie sich an Ihren Administrator.',
  auth_callback_error: 'Anmeldefehler aufgetreten. Bitte versuchen Sie es erneut.',
}

function LoginPageContent() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const errorMessage = errorParam ? (ERROR_MESSAGES[errorParam] ?? 'Ein Fehler ist aufgetreten.') : null

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        toast.error(
          error.message === 'Invalid login credentials'
            ? 'E-Mail oder Passwort ist falsch'
            : error.message
        )
        return
      }

      window.location.href = '/setup/profile'
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
        <CardTitle className="text-2xl">Willkommen zurück</CardTitle>
        <CardDescription>Melden Sie sich mit Ihrer E-Mail-Adresse an</CardDescription>
      </CardHeader>

      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Passwort</FormLabel>
                    <Link
                      href="/auth/reset-password"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Passwort vergessen?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Anmelden...' : 'Anmelden'}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Noch kein Konto?{' '}
          <Link href="/auth/register" className="text-primary hover:underline font-medium">
            Registrieren
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}
