import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import LaunchCountdown from "@/components/LaunchCountdown";
import HeroCarousel from "@/components/HeroCarousel";
import HomeCollectionSection from "@/components/HomeCollectionSection";
import BestSellingStores from "@/components/BestSellingStores";
import FooterBanner from "@/components/FooterBanner";
import SiteFooter from "@/components/SiteFooter";
import DealOfTheDayBanner from "@/components/banners/DealOfTheDayBanner";
import TrustBanner from "@/components/banners/TrustBanner";
import CategoryHighlightBanner from "@/components/banners/CategoryHighlightBanner";

const Index = () => (
  <div className="min-h-screen bg-background">
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Unitech India",
          url: "https://unitechshop.com",
          logo: "https://unitechshop.com/unitech-logo.png",
          description:
            "Premium audio equipment & electronics since 1994. Tower speakers, home theatre, car audio & more.",
          foundingDate: "1994",
          sameAs: [],
        }),
      }}
    />
    <TopBar />
    <StickyHeader />
    <LaunchCountdown />
    <HeroCarousel />
    <BestSellingStores />
    <DealOfTheDayBanner />
    <HomeCollectionSection
      title="Featured"
      collection={["featured", "hot-selling"]}
      className="pb-0 md:pb-0"
      variant="featured"
    />
    <CategoryHighlightBanner />
    <HomeCollectionSection
      title="New Arrivals"
      collection="new-arrivals"
      className="pt-8 md:pt-10"
      variant="new-arrivals"
    />
    <TrustBanner />
    <FooterBanner />
    <SiteFooter />
  </div>
);

export default Index;
