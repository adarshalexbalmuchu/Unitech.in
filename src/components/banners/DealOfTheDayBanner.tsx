import { Link } from "react-router-dom";

/**
 * Full-width promotional banner using uploaded banner image.
 */
const DealOfTheDayBanner = () => (
  <section className="relative w-full overflow-hidden">
    <Link to="/products" className="block">
      <img
        src="/banners/1.png"
        alt="Upgrade Your Everyday Essentials – With Powerful Performance"
        className="w-full h-auto object-cover"
        loading="lazy"
      />
    </Link>
  </section>
);

export default DealOfTheDayBanner;
