import { StarField } from "@/components/mystical/starfield";
import { Navbar } from "@/components/mystical/navbar";
import { HeroSection } from "@/components/mystical/hero-section";
import { PainPointsSection } from "@/components/mystical/pain-points-section";
import { AboutSection } from "@/components/mystical/about-section";
import { ServicesSection } from "@/components/mystical/services-section";
import { CardOfDaySection } from "@/components/mystical/card-of-day-section";
import { ThreeCardsSection } from "@/components/mystical/three-cards-section";
import { MoonSection } from "@/components/mystical/moon-section";
import { HoroscopeSection } from "@/components/mystical/horoscope-section";
import { TestimonialsSection } from "@/components/mystical/testimonials-section";
import { HowIWorkSection } from "@/components/mystical/how-i-work-section";
import { BookingSection } from "@/components/mystical/booking-section";
import { GuaranteeSection } from "@/components/mystical/guarantee-section";
import { BlogSection } from "@/components/mystical/blog-section";
import { FaqSection } from "@/components/mystical/faq-section";
import { Footer } from "@/components/mystical/footer";
import { ChatWidget } from "@/components/mystical/chat-widget";
import { homeJsonLd } from "@/lib/seo";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        // Task 23: структурированные данные Schema.org (Person + WebSite + OfferCatalog)
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd()) }}
      />
      <StarField />
      <Navbar />
      <main className="flex-1 relative z-10">
        <HeroSection />
        <PainPointsSection />
        <AboutSection />
        <ServicesSection />
        <CardOfDaySection />
        <ThreeCardsSection />
        <MoonSection />
        <HoroscopeSection />
        <TestimonialsSection />
        <HowIWorkSection />
        <BookingSection />
        <GuaranteeSection />
        <BlogSection />
        <FaqSection />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
