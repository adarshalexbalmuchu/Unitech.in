import { CATEGORIES } from "@/lib/constants";

const CategoryRow = () => (
  <section className="max-w-[1280px] mx-auto px-6 pt-4 pb-8">
    <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2">
      {CATEGORIES.map((cat) => (
        <div
          key={cat.slug}
          className="flex-shrink-0 flex flex-col items-center gap-3 cursor-pointer group snap-start"
          style={{ minWidth: 80 }}
        >
          <div className="w-16 h-16 bg-surface rounded-2xl flex justify-center items-center text-[1.75rem] vm-transition group-hover:bg-primary/10 group-hover:-translate-y-1">
            {cat.icon}
          </div>
          <span className="text-xs font-semibold text-center">{cat.label}</span>
        </div>
      ))}
    </div>
  </section>
);

export default CategoryRow;
