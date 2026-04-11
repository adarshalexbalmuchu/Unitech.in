import { Link, useNavigate } from "react-router-dom";
import { User, Package, Heart, LogOut, Shield } from "lucide-react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Account = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { wishlistItems } = useWishlist();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <StickyHeader />
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-20 text-center">
          <User className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" strokeWidth={1} />
          <h1 className="text-2xl font-bold mb-2">Sign in to your account</h1>
          <p className="text-muted-foreground mb-6">Login to view your profile, orders, and more</p>
          <div className="flex gap-3 justify-center">
            <Button asChild><Link to="/login">Login</Link></Button>
            <Button variant="outline" asChild><Link to="/signup">Sign Up</Link></Button>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <StickyHeader />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-12 md:pb-16">
        <h1 className="text-xl md:text-2xl font-extrabold mb-6">My Account</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Name</p>
                  <p className="text-sm font-medium">{user.user_metadata?.full_name || "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Member Since</p>
                  <p className="text-sm font-medium">{new Date(user.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Role</p>
                  <p className="text-sm font-medium">{isAdmin ? "Admin" : "Customer"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="space-y-4">
            <Link to="/wishlist" className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors">
              <Heart className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Wishlist</p>
                <p className="text-xs text-muted-foreground">{wishlistItems.length} items</p>
              </div>
            </Link>
            <Link to="/account/orders" className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors">
              <Package className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Orders</p>
                <p className="text-xs text-muted-foreground">Track & manage</p>
              </div>
            </Link>
            {isAdmin && (
              <Link to="/admin/products" className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors">
                <Shield className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Admin Panel</p>
                  <p className="text-xs text-muted-foreground">Manage products</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Sign out */}
        <div className="mt-8 pt-6 border-t border-border">
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};

export default Account;
