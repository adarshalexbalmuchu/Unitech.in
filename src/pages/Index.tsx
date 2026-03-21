import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import HeroCarousel from "@/components/HeroCarousel";
import ShopByCategory from "@/components/ShopByCategory";
import HomeCollectionSection from "@/components/HomeCollectionSection";
import BestSellingStores from "@/components/BestSellingStores";
import FooterBanner from "@/components/FooterBanner";
import SiteFooter from "@/components/SiteFooter";

const Index = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <StickyHeader />
    <HeroCarousel />
    <ShopByCategory />
    <HomeCollectionSection
      title="Featured"
      collection={["featured", "hot-selling"]}
      className="pb-0 md:pb-0"
      variant="featured"
    />
    <HomeCollectionSection
      title="New Arrivals"
      collection="new-arrivals"
      className="pt-8 md:pt-10"
      variant="new-arrivals"
    />
    <BestSellingStores />
    <FooterBanner />
    <SiteFooter />
  </div>
);

export default Index;
