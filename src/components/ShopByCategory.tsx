import { Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/constants";

const ShopByCategory = () => (
  <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-10 md:py-14">
    <h2 className="text-lg md:text-2xl font-bold text-foreground mb-6 md:mb-8">
      Shop by Category
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.slug}
            to={`/products/${cat.slug}`}
            className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/40 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 py-6 px-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center transition-colors">
              <Icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
            </div>
            <span className="text-xs md:text-sm font-medium text-foreground/70 group-hover:text-foreground text-center leading-tight transition-colors">
              {cat.label}
            </span>
          </Link>
        );
      })}
    </div>
  </section>
);

export default ShopByCategory;
