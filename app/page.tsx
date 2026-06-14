
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import HowItWorks from "@/components/landing/HowItWorks";
import AudienceSection from "@/components/landing/AudienceSection";
import WhyChoose from "@/components/landing/WhyChoose";
import Testimonials from "@/components/landing/Testimonials";
import TrustSafety from "@/components/landing/TrustSafety";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-stitch-background text-stitch-on-surface">
      <Header />
      <main className="grow">
        <Hero />
        <Stats />
        <HowItWorks />
        <AudienceSection />
        <WhyChoose />
        <Testimonials />
        <TrustSafety />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

