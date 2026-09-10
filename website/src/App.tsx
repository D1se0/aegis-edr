import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { Protection } from '@/components/Protection'
import { Features } from '@/components/Features'
import { Downloads } from '@/components/Downloads'
import { Install } from '@/components/Install'
import { GithubBanner } from '@/components/GithubBanner'
import { Footer } from '@/components/Footer'

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Protection />
        <Features />
        <Downloads />
        <Install />
        <GithubBanner />
      </main>
      <Footer />
    </div>
  )
}
