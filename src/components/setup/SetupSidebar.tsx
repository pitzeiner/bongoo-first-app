'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Building2, Users, LogOut, QrCode, Menu, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const adminNavItems: NavItem[] = [
  { href: '/setup/profile', label: 'Vereinsprofil', icon: Building2 },
  { href: '/setup/users', label: 'Benutzer', icon: Users },
]

const setupUserNavItems: NavItem[] = [
  { href: '/setup/users', label: 'QR-Codes', icon: QrCode },
]

interface SetupSidebarProps {
  role: string
  displayName: string
  userEmail: string
}

export function SetupSidebar({ role, displayName, userEmail }: SetupSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navItems = role === 'admin' ? adminNavItems : setupUserNavItems

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const navContent = (
    <>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        <Link
          href="/auth/update-password"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 px-2 py-1.5 mb-1 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-gray-100 transition-colors"
        >
          <KeyRound className="h-4 w-4" />
          Passwort ändern
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile: fixierter Header-Balken mit Sheet-Trigger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b flex items-center px-4 gap-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menü öffnen">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 flex flex-col">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="p-6 border-b">
              <span className="text-xl font-bold tracking-tight">BonGoo</span>
              <p className="text-xs text-muted-foreground mt-0.5">Setup</p>
            </div>
            {navContent}
          </SheetContent>
        </Sheet>
        <span className="text-lg font-bold tracking-tight">BonGoo</span>
      </div>

      {/* Desktop: fixierte Sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen bg-white border-r flex-col shrink-0">
        <div className="p-6 border-b">
          <span className="text-xl font-bold tracking-tight">BonGoo</span>
          <p className="text-xs text-muted-foreground mt-0.5">Setup</p>
        </div>
        {navContent}
      </aside>
    </>
  )
}
