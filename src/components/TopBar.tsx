import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const TopBar = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();

  const scrollToFooter = (e: React.MouseEvent) => {
    e.preventDefault();
    document.querySelector("footer")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-surface text-vm-muted text-xs font-medium py-2">
      <div className="max-w-[1280px] mx-auto px-6 flex justify-between items-center">
        <div className="hidden md:flex gap-6">
          <a href="#footer" onClick={scrollToFooter} className="hover:text-primary vm-transition">About Unitech</a>
          <a href="#footer" onClick={scrollToFooter} className="hover:text-primary vm-transition">Customer Care</a>
        </div>
        <div className="flex gap-3 items-center ml-auto">
          {user ? (
            <>
              <Link to="/admin/products" className="hover:text-primary vm-transition">Admin Panel</Link>
              <span>|</span>
              <span className="text-muted-foreground">{user.email}</span>
              <span>|</span>
              <button onClick={signOut} className="hover:text-primary vm-transition">Logout</button>
            </>
          ) : (
            <>
              <Link to="/signup" className="hover:text-primary vm-transition">Sign Up</Link>
              <span>|</span>
              <Link to="/login" className="hover:text-primary vm-transition">Login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
