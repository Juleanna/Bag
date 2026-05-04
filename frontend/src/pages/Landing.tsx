import { useSaasMode } from '../hooks/useSaasMode'
import { SaasNav } from './landing/SaasNav'
import { Hero } from './landing/Hero'
import {
  Features,
  UseCases,
  MetricsSection,
  Integrations,
  Testimonials,
  FAQ,
  CtaStrip,
  Footer,
} from './landing/Sections'

export function LandingPage() {
  useSaasMode()
  return (
    <>
      <SaasNav />
      <Hero />
      <Features />
      <UseCases />
      <MetricsSection />
      <Integrations />
      <Testimonials />
      <FAQ />
      <CtaStrip />
      <Footer />
    </>
  )
}
