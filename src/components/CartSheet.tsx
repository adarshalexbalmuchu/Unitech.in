import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { isPlaceholderImage } from "@/lib/constants";

const CartSheet = () => {
  const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="p-2 rounded-full hover:bg-surface vm-transition relative" aria-label="Cart">
          <ShoppingCart className="w-5 h-5 text-muted-foreground hover:text-primary" strokeWidth={1.5} />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
              {cartCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Cart ({cartCount})</SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Your cart is empty
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  {!isPlaceholderImage(item.product.image_url) ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-16 h-16 rounded-lg object-cover bg-surface" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-muted-foreground/30" strokeWidth={1} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-sm text-primary font-semibold">₹{item.product.price.toLocaleString("en-IN")}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded hover:bg-surface">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded hover:bg-surface">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeFromCart(item.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive ml-auto">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
              <Button className="w-full" onClick={() => navigate("/checkout")}>Proceed to Checkout</Button>
              <Button variant="outline" className="w-full" onClick={clearCart}>Clear Cart</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
