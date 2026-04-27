import { Link } from "react-router-dom";

/**
 * Full-width promotional banner using uploaded banner image.
 */
const DealOfTheDayBanner = () => (
  <section className="relative w-full overflow-hidden">
    <Link to="/products" className="block">
      <img
        src="/banners/banner1.jpeg"
        alt="Unitech Fan – Yeh Fan Nahi, Toofan Hai"
        className="w-full h-auto object-cover"
        loading="lazy"
      />
    </Link>
  </section>
);

export default DealOfTheDayBanner;
