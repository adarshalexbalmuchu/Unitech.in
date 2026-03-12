import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import HeroCarousel from "@/components/HeroCarousel";
import CategoryRow from "@/components/CategoryRow";
import FlashSale from "@/components/FlashSale";
import TodaysForYou from "@/components/TodaysForYou";
import BestSellingStores from "@/components/BestSellingStores";
import FooterBanner from "@/components/FooterBanner";
import SiteFooter from "@/components/SiteFooter";

const Index = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <StickyHeader />
    <HeroCarousel />
    <CategoryRow />
    <FlashSale />
    <TodaysForYou />
    <BestSellingStores />
    <FooterBanner />
    <SiteFooter />
  </div>
);

export default Index;
