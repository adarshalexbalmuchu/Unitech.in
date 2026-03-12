const ProductCardSkeleton = () => (
  <div className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
    <div className="relative bg-muted p-6 aspect-square">
      <div className="w-full h-full bg-muted-foreground/10 rounded-lg" />
    </div>
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-3 h-3 bg-muted-foreground/10 rounded" />
          ))}
        </div>
        <div className="w-8 h-3 bg-muted-foreground/10 rounded" />
      </div>
      <div className="w-24 h-5 bg-muted-foreground/10 rounded-full" />
      <div className="space-y-2">
        <div className="w-full h-4 bg-muted-foreground/10 rounded" />
        <div className="w-3/4 h-4 bg-muted-foreground/10 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-20 h-6 bg-muted-foreground/10 rounded" />
        <div className="w-16 h-4 bg-muted-foreground/10 rounded" />
      </div>
      <div className="w-full h-12 bg-muted-foreground/10 rounded-xl" />
    </div>
  </div>
);

export default ProductCardSkeleton;
