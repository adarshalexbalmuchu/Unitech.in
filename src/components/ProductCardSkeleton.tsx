const ProductCardSkeleton = () => (
  <div className="bg-white rounded-xl flex flex-col gap-0 animate-pulse overflow-hidden">
    {/* Image */}
    <div className="w-full aspect-square bg-[#F0F0F0] rounded-xl" />
    {/* Info */}
    <div className="px-1 pt-3 pb-1 space-y-2">
      <div className="w-14 h-2 bg-muted-foreground/15 rounded" />
      <div className="space-y-1.5">
        <div className="w-full h-3 bg-muted-foreground/15 rounded" />
        <div className="w-3/4 h-3 bg-muted-foreground/10 rounded" />
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 bg-muted-foreground/15 rounded-full" />
        <div className="w-20 h-2.5 bg-muted-foreground/10 rounded" />
      </div>
      <div className="flex items-baseline gap-2 pt-1">
        <div className="w-16 h-5 bg-muted-foreground/15 rounded" />
        <div className="w-10 h-3 bg-muted-foreground/10 rounded" />
      </div>
    </div>
  </div>
);

export default ProductCardSkeleton;
