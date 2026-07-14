import {
  SmoothScroll,
  Spotlight,
  Hero,
  LogoCloud,
  ProblemSection,
  SolutionSection,
  FeaturesBento,
  MetricsSection,
  ArchitectureSection,
  Testimonials,
  Pricing,
  FinalCTA,
  Footer,
} from "@/components/landing"

export default function LandingPage() {
  return (
    <SmoothScroll>
      <Spotlight />
      <Hero />
      <LogoCloud />
      <ProblemSection />
      <SolutionSection />
      <FeaturesBento />
      <MetricsSection />
      <ArchitectureSection />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </SmoothScroll>
  )
}
