import { CATEGORIES } from "@/lib/constants";

const CategoryRow = () => (
  <section className="max-w-[1280px] mx-auto px-6 pt-4 pb-8">
    <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <div
            key={cat.slug}
            className="flex-shrink-0 flex flex-col items-center gap-3 cursor-pointer group snap-start"
            style={{ minWidth: 80 }}
          >
            <div className="w-16 h-16 bg-surface rounded-2xl flex justify-center items-center vm-transition group-hover:bg-primary/10 group-hover:-translate-y-1">
              <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-semibold text-center">{cat.label}</span>
          </div>
        );
      })}
    </div>
  </section>
);

export default CategoryRow;
