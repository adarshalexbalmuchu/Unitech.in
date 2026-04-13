import { ReactNode } from "react";
import AdminBottomNav from "./AdminBottomNav";

const AdminLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background pb-16 md:pb-0">
    {children}
    <AdminBottomNav />
  </div>
);

export default AdminLayout;
