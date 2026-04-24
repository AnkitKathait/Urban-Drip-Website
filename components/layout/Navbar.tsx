'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, User, Search, X, Menu, ChevronRight } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Anime',       href: '/collections/anime'       },
  { label: 'Sports',      href: '/collections/sports'      },
  { label: 'Streetwear',  href: '/collections/streetwear'  },
  { label: 'AI',          href: '/collections/ai'          },
  { label: 'Gaming',      href: '/collections/gaming'      },
  { label: 'Music',       href: '/collections/music'       },
  { label: 'All Drops',   href: '/products'                },
]

export function Navbar() {
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [announced,  setAnnounced]  = useState(true)
  const pathname   = usePathname()
  const { itemCount, openCart } = useCart()
  const { user, isAdmin }       = useAuth()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <>
      {/* ── Red top stripe ──────────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-ud-accent" />

      {/* ── Announcement bar ─────────────────────────────────────────────────── */}
      {announced && (
        <div
          className="fixed top-[3px] left-0 right-0 z-50 h-9 flex items-center justify-center bg-[#0F0F0F] border-b border-[#1E1E1E]"
          style={{ paddingTop: 0 }}
        >
          <p className="font-heading text-[10px] tracking-[0.25em] text-[#888]">
            FREE SHIPPING ON ORDERS ABOVE ₹999&nbsp;
            <span className="text-ud-accent">—&nbsp;SS2026 COLLECTION NOW LIVE</span>
          </p>
          <button
            onClick={() => setAnnounced(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Main navbar ──────────────────────────────────────────────────────── */}
      <header
        className={cn(
          'fixed left-0 right-0 z-50 transition-all duration-300',
          announced ? 'top-[39px]' : 'top-[3px]',
          scrolled
            ? 'bg-[#080808]/96 backdrop-blur-md border-b border-[#1E1E1E]'
            : 'bg-transparent'
        )}
      >
        <div className="ud-container">
          <div className="flex items-center justify-between h-[60px]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-0 group shrink-0">
              <span className="font-display text-[22px] text-ud-white group-hover:text-ud-accent transition-colors duration-150 tracking-[0.08em]">
                URBAN
              </span>
              <span className="font-display text-[22px] text-ud-accent ml-[6px] tracking-[0.08em]">
                DRIP
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-10">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'nav-link',
                    pathname === link.href || pathname.startsWith(link.href + '/')
                      ? 'active'
                      : ''
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <Link
                href="/products"
                className="hidden md:flex p-2.5 text-[#555] hover:text-ud-white transition-colors"
                aria-label="Search"
              >
                <Search className="w-[18px] h-[18px]" />
              </Link>

              <Link
                href={user ? '/account' : '/login'}
                className="p-2.5 text-[#555] hover:text-ud-white transition-colors"
                aria-label="Account"
              >
                <User className="w-[18px] h-[18px]" />
              </Link>

              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="hidden md:flex items-center px-3 py-1 text-[10px] font-heading tracking-[0.2em] text-ud-gold border border-ud-gold/30 hover:border-ud-gold/70 transition-colors"
                >
                  ADMIN
                </Link>
              )}

              <button
                onClick={openCart}
                className="relative p-2.5 text-[#555] hover:text-ud-white transition-colors"
                aria-label={`Cart (${itemCount})`}
              >
                <ShoppingBag className="w-[18px] h-[18px]" />
                {itemCount > 0 && (
                  <span className="absolute -top-0 -right-0 min-w-[16px] h-[16px] flex items-center justify-center bg-ud-accent text-white text-[9px] font-mono rounded-full px-[3px]">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileOpen(o => !o)}
                className="md:hidden p-2.5 text-[#555] hover:text-ud-white transition-colors"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile fullscreen menu ─────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 z-40 md:hidden transition-all duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div
          className="absolute inset-0 bg-[#080808]/90 backdrop-blur-lg"
          onClick={() => setMobileOpen(false)}
        />
        <nav
          className={cn(
            'absolute top-0 left-0 right-0 bg-[#0D0D0D] border-b border-[#222] pt-24 pb-8 transition-transform duration-300',
            mobileOpen ? 'translate-y-0' : '-translate-y-full'
          )}
        >
          <div className="ud-container flex flex-col gap-0">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between py-4 border-b border-[#1A1A1A] font-heading text-xl text-ud-white tracking-wider hover:text-ud-accent transition-colors"
              >
                {link.label}
                <ChevronRight className="w-4 h-4 text-[#555]" />
              </Link>
            ))}
            <Link
              href={user ? '/account' : '/login'}
              className="flex items-center justify-between py-4 border-b border-[#1A1A1A] font-heading text-xl text-[#888] hover:text-ud-white transition-colors tracking-wider"
            >
              {user ? 'MY ACCOUNT' : 'LOGIN / REGISTER'}
              <ChevronRight className="w-4 h-4 text-[#555]" />
            </Link>
          </div>
        </nav>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0D0D0D] border-t border-[#1E1E1E]">
        <div className="grid grid-cols-4 h-[60px]">
          {[
            { href: '/',        label: 'HOME',    Icon: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M3 12L12 3l9 9M4.5 10.5V20a.5.5 0 0 0 .5.5h5v-5h4v5h5a.5.5 0 0 0 .5-.5v-9.5" /></svg> },
            { href: '/products',label: 'SHOP',    Icon: () => <Search className="w-5 h-5" /> },
            { href: user ? '/account' : '/login', label: 'ACCOUNT', Icon: () => <User className="w-5 h-5" /> },
          ].map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-[9px] font-heading tracking-[0.15em] transition-colors',
                pathname === href || (href !== '/' && pathname.startsWith(href))
                  ? 'text-ud-accent'
                  : 'text-[#555]'
              )}
            >
              <Icon />
              {label}
            </Link>
          ))}
          <button
            onClick={openCart}
            className="flex flex-col items-center justify-center gap-1 text-[9px] font-heading tracking-[0.15em] text-[#555] relative"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute top-2 right-5 min-w-[14px] h-[14px] flex items-center justify-center bg-ud-accent text-white text-[8px] font-mono rounded-full px-0.5">
                {itemCount}
              </span>
            )}
            CART
          </button>
        </div>
      </nav>
    </>
  )
}
