'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingBag, Layers, Star, Users, LogOut } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin/dashboard', label: 'DASHBOARD',  Icon: LayoutDashboard },
  { href: '/admin/products',  label: 'PRODUCTS',   Icon: Package },
  { href: '/admin/orders',    label: 'ORDERS',     Icon: ShoppingBag },
  { href: '/admin/inventory', label: 'INVENTORY',  Icon: Layers },
  { href: '/admin/reviews',   label: 'REVIEWS',    Icon: Star },
  { href: '/admin/customers', label: 'CUSTOMERS',  Icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-[#0C0C0C] border-r border-[#1E1E1E] flex flex-col z-40">

      {/* Logo */}
      <div className="p-5 border-b border-[#1E1E1E]">
        <div className="flex items-center gap-2.5">
          <div className="w-[3px] h-6 bg-ud-accent flex-shrink-0" />
          <span className="font-display text-[18px] leading-none">
            <span className="text-ud-white">URBAN</span>
            <span className="text-ud-accent">DRIP</span>
          </span>
        </div>
        <p className="font-heading text-[9px] tracking-[0.25em] text-[#3A3A3A] mt-2 ml-[19px]">ADMIN PANEL</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 text-[11px] font-heading tracking-[0.12em] transition-all duration-150 relative',
                    active
                      ? 'text-ud-white bg-[#1A1A1A]'
                      : 'text-[#444] hover:text-[#888] hover:bg-[#141414]'
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-ud-accent" />
                  )}
                  <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', active ? 'text-ud-accent' : '')} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[#1E1E1E]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-[11px] font-heading tracking-[0.12em] text-[#444] hover:text-ud-accent transition-colors duration-150"
        >
          <LogOut className="w-3.5 h-3.5" />
          SIGN OUT
        </button>
      </div>
    </aside>
  )
}
