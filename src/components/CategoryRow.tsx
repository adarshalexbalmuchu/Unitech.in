import { Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/constants";

const CategoryRow = () => (
  <section className="border-b border-border bg-white">
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4 md:py-5">
      <div className="flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-none">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground pr-1 md:pr-2 border-r border-border mr-1 md:mr-2">
          Shop
        </span>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.slug}
              to={`/products/${cat.slug}`}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[11px] md:text-xs font-semibold text-foreground/70 hover:text-foreground hover:border-foreground/30 hover:bg-muted transition-all duration-150"
            >
              <Icon className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary" strokeWidth={2} />
              {cat.label}
            </Link>
          );
        })}
      </div>
    </div>
  </section>
);

export default CategoryRow;
