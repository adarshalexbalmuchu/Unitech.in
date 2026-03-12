import { Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/constants";

const CategoryRow = () => (
  <section className="max-w-[1280px] mx-auto px-4 md:px-6 pt-2 md:pt-4 pb-6 md:pb-8">
    <div className="flex justify-center items-start gap-4 md:gap-6 lg:gap-8 overflow-x-auto scrollbar-none pb-2">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.slug}
            to={`/products/${cat.slug}`}
            className="flex-shrink-0 flex flex-col items-center gap-2 md:gap-3 cursor-pointer group w-20 md:w-24 lg:w-28"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-surface rounded-xl md:rounded-2xl flex justify-center items-center transition-all duration-300 group-hover:bg-primary/10 group-hover:-translate-y-1">
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
            </div>
            <span className="text-[10px] md:text-xs font-semibold text-center leading-tight w-full break-words px-1">
              {cat.label}
            </span>
          </Link>
        );
      })}
    </div>
  </section>
);

export default CategoryRow;
