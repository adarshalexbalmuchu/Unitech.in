const ProductCardSkeleton = () => (
  <div className="bg-card rounded-lg outline outline-1 outline-border -outline-offset-1 p-2.5 sm:p-3 flex flex-col gap-2 sm:gap-3 animate-pulse">
    {/* Image */}
    <div className="w-full aspect-square bg-muted rounded-md" />
    {/* Category */}
    <div className="w-20 h-2.5 bg-muted-foreground/15 rounded" />
    {/* Spec summary */}
    <div className="w-32 h-2.5 bg-muted-foreground/10 rounded" />
    {/* Name */}
    <div className="space-y-1.5">
      <div className="w-full h-3.5 bg-muted-foreground/15 rounded" />
      <div className="w-3/4 h-3.5 bg-muted-foreground/10 rounded" />
    </div>
    {/* Rating */}
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 bg-muted-foreground/15 rounded" />
      <div className="w-16 h-3 bg-muted-foreground/10 rounded" />
    </div>
    {/* Price */}
    <div className="flex items-baseline gap-2">
      <div className="w-16 h-5 bg-muted-foreground/15 rounded" />
      <div className="w-12 h-3.5 bg-muted-foreground/10 rounded" />
    </div>
    {/* Add to cart button */}
    <div className="w-full h-10 bg-muted-foreground/10 rounded-md" />
  </div>
);

export default ProductCardSkeleton;
