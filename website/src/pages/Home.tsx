import { Hero } from '@/components/Hero'
import { Protection } from '@/components/Protection'
import { Features } from '@/components/Features'
import { Downloads } from '@/components/Downloads'
import { Install } from '@/components/Install'
import { GithubBanner } from '@/components/GithubBanner'

export default function Home() {
  return (
    <>
      <Hero />
      <Protection />
      <Features />
      <Downloads />
      <Install />
      <GithubBanner />
    </>
  )
}
