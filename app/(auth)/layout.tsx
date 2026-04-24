import Link from 'next/link'
import { Flame } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ud-gradient flex flex-col">
      {/* Top bar */}
      <div className="p-4 border-b border-ud-gray">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Flame className="w-5 h-5 text-ud-accent" />
          <span className="font-bebas text-xl text-ud-white tracking-widest">URBAN DRIP</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>

      <div className="p-4 text-center">
        <p className="text-ud-muted text-xs font-mono">
          © {new Date().getFullYear()} Urban Drip · Wear the legend.
        </p>
      </div>
    </div>
  )
}
