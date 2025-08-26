import { Navbar } from '@/components/navbar'
import Pricing from '@/components/pricing'
import Footer from '@/components/footer'

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Pricing />
      <Footer />
    </main>
  )
}