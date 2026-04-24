'use client'

import Link from 'next/link'
import { Instagram, Youtube, Twitter } from 'lucide-react'

const COLLECTIONS = [
  { label: 'Anime',      href: '/collections/anime'      },
  { label: 'Sports',     href: '/collections/sports'     },
  { label: 'Streetwear', href: '/collections/streetwear' },
  { label: 'AI',         href: '/collections/ai'         },
  { label: 'Gaming',     href: '/collections/gaming'     },
  { label: 'Music',      href: '/collections/music'      },
  { label: 'New Arrivals', href: '/products'             },
]

const SUPPORT = [
  { label: 'Size Guide',       href: '/size-guide'     },
  { label: 'Shipping Policy',  href: '/shipping'       },
  { label: 'Returns',          href: '/returns'        },
  { label: 'Contact Us',       href: '/contact'        },
  { label: 'Track Order',      href: '/account/orders' },
]

export function Footer() {
  return (
    <footer className="bg-[#080808] border-t border-[#1E1E1E] mt-0">

      {/* ── Big wordmark ──────────────────────────────────────────────────── */}
      <div className="border-b border-[#1A1A1A] overflow-hidden">
        <div className="ud-container py-10 md:py-14">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div
              className="font-display text-[clamp(4rem,14vw,11rem)] leading-none select-none"
              aria-label="Urban Drip"
            >
              <span className="text-[#1C1C1C]">URBAN</span>
              <span className="text-ud-accent ml-[0.12em]">DRIP</span>
            </div>
            <p className="font-sans text-sm text-[#444] max-w-xs leading-relaxed pb-2">
              India&apos;s premium anime streetwear, gymwear & pickleball brand.
              Wear the legend. Live the drip.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="ud-container py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">

          {/* Collections */}
          <div>
            <h4 className="font-heading text-[10px] tracking-[0.3em] text-[#555] mb-5">COLLECTIONS</h4>
            <ul className="space-y-3">
              {COLLECTIONS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#444] text-sm font-sans hover:text-ud-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-heading text-[10px] tracking-[0.3em] text-[#555] mb-5">SUPPORT</h4>
            <ul className="space-y-3">
              {SUPPORT.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#444] text-sm font-sans hover:text-ud-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-heading text-[10px] tracking-[0.3em] text-[#555] mb-5">FOLLOW US</h4>
            <div className="flex flex-col gap-4">
              {[
                { href: 'https://instagram.com/urbandrip', Icon: Instagram, label: '@urbandrip', platform: 'Instagram' },
                { href: 'https://youtube.com/@urbandrip',  Icon: Youtube,   label: 'Urban Drip', platform: 'YouTube'   },
                { href: 'https://twitter.com/urbandrip',   Icon: Twitter,   label: '@urbandrip', platform: 'Twitter'   },
              ].map(({ href, Icon, label, platform }) => (
                <a
                  key={platform}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[#444] hover:text-ud-white transition-colors duration-150 group"
                >
                  <Icon className="w-4 h-4 group-hover:text-ud-accent transition-colors" />
                  <span className="text-sm font-sans">{label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-heading text-[10px] tracking-[0.3em] text-[#555] mb-5">JOIN THE DRIP</h4>
            <p className="text-[#444] text-sm font-sans mb-4 leading-relaxed">
              Early access to drops & exclusive offers.
            </p>
            <form className="flex flex-col gap-2" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="your@email.com"
                className="input-field text-sm py-2.5"
              />
              <button
                type="submit"
                className="btn-primary text-xs py-2.5 tracking-[0.2em]"
              >
                SUBSCRIBE
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div className="border-t border-[#1A1A1A]">
        <div className="ud-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-heading text-[10px] tracking-[0.2em] text-[#333]">
            © {new Date().getFullYear()} URBAN DRIP. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms',   href: '/terms'   },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="font-heading text-[10px] tracking-[0.2em] text-[#333] hover:text-[#666] transition-colors"
              >
                {label.toUpperCase()}
              </Link>
            ))}
          </div>
          <p className="font-heading text-[10px] tracking-[0.15em] text-[#333]">
            MADE WITH ❤️ FOR INDIA
          </p>
        </div>
      </div>

      {/* ── Red bottom accent ─────────────────────────────────────────────── */}
      <div className="h-[3px] bg-ud-accent" />
    </footer>
  )
}
