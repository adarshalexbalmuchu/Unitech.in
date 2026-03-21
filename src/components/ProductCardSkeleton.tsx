const ProductCardSkeleton = () => (
  <div className="flex flex-col animate-pulse">
    {/* Image block */}
    <div className="w-full aspect-square bg-[#F0F0F0]" />
    {/* Info */}
    <div className="pt-3 space-y-2">
      <div className="h-3.5 bg-[#EBEBEB] rounded w-4/5" />
      <div className="h-3 bg-[#EBEBEB] rounded w-3/5" />
      <div className="flex items-center justify-between pt-1">
        <div className="h-3.5 bg-[#EBEBEB] rounded w-16" />
        <div className="h-3 bg-[#EBEBEB] rounded w-16" />
      </div>
    </div>
  </div>
);

export default ProductCardSkeleton;
