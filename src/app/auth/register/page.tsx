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

const schema = z
  .object({
    email: z.string().email('Ungültige E-Mail-Adresse'),
    password: z.string().min(8, 'Mindestens 8 Zeichen'),
    confirmPassword: z.string().min(1, 'Bitte Passwort bestätigen'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error(
          error.message === 'User already registered'
            ? 'Diese E-Mail-Adresse ist bereits registriert'
            : error.message
        )
        return
      }

      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <div className="mb-2">
            <span className="text-2xl font-bold tracking-tight">BonGoo</span>
          </div>
          <CardTitle className="text-2xl">E-Mail bestätigen</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Wir haben Ihnen eine Bestätigungs-E-Mail gesendet. Bitte klicken Sie auf den Link in
              der E-Mail, um Ihr Konto zu aktivieren.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/login" className="text-sm text-primary hover:underline">
            Zurück zum Login
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="mb-2">
          <span className="text-2xl font-bold tracking-tight">BonGoo</span>
        </div>
        <CardTitle className="text-2xl">Konto erstellen</CardTitle>
        <CardDescription>Registrieren Sie Ihren Verein auf BonGoo</CardDescription>
      </CardHeader>

      <CardContent>
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
                  <FormLabel>Passwort</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Mindestens 8 Zeichen" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passwort bestätigen</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Konto wird erstellt...' : 'Registrieren'}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Bereits registriert?{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            Anmelden
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
