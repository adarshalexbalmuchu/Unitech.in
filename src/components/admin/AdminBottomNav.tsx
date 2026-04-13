import { Link, useLocation } from "react-router-dom";
import { Package, ShoppingCart, BarChart3, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/wholesale-leads", label: "Leads", icon: Users },
  { to: "/", label: "Store", icon: BarChart3 },
];

const AdminBottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex h-14">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to) && to !== "/" || (to === "/" && pathname === "/");
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-h-[44px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default AdminBottomNav;
