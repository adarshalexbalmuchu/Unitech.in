import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import HeroCarousel from "@/components/HeroCarousel";
import CategoryRow from "@/components/CategoryRow";
import HomeCollectionSection from "@/components/HomeCollectionSection";
import BestSellingStores from "@/components/BestSellingStores";
import FooterBanner from "@/components/FooterBanner";
import SiteFooter from "@/components/SiteFooter";

const Index = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <StickyHeader />
    <HeroCarousel />
    <CategoryRow />
    <HomeCollectionSection title="Featured Products" collection="featured" className="pb-0 md:pb-0" />
    <HomeCollectionSection title="Hot Selling Products" collection="hot-selling" className="pt-8 md:pt-10 pb-0 md:pb-0" />
    <HomeCollectionSection title="New Arrivals" collection="new-arrivals" className="pt-8 md:pt-10" />
    <BestSellingStores />
    <FooterBanner />
    <SiteFooter />
  </div>
);

export default Index;
