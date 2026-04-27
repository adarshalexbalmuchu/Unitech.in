import { Link } from "react-router-dom";

const CategoryHighlightBanner = () => (
  <section className="relative w-full overflow-hidden">
    <Link to="/products/tools-appliances" className="block">
      <img
        src="/banners/1.png"
        alt="Upgrade Your Everyday Essentials – With Powerful Performance"
        className="w-full h-auto object-cover"
        loading="lazy"
      />
    </Link>
  </section>
);

export default CategoryHighlightBanner;
