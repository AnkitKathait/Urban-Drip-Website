import { Navbar }     from '@/components/layout/Navbar'
import { Footer }     from '@/components/layout/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[99px] pb-mobile-nav">
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </>
  )
}
