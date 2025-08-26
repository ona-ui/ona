
import { Navbar } from '@/components/navbar'
import Hero from '@/components/hero'
import Footer from '@/components/footer'
import Faq from '@/components/faq'


export default function Page() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Faq />
      <Footer />
    </main>
  )
}
