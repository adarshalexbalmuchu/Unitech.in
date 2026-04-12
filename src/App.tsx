import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import AdminGuard from "@/components/AdminGuard";

// Eager: landing + product pages (critical path)
import Index from "./pages/Index.tsx";
import ProductListing from "./pages/ProductListing.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";

// Lazy: everything else — loaded on demand
const AdminProducts = lazy(() => import("./pages/AdminProducts.tsx"));
const AdminProductForm = lazy(() => import("./pages/AdminProductForm.tsx"));
const AdminOrders = lazy(() => import("./pages/AdminOrders.tsx"));
const AdminWholesaleLeads = lazy(() => import("./pages/AdminWholesaleLeads.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const SignUp = lazy(() => import("./pages/SignUp.tsx"));
const Wishlist = lazy(() => import("./pages/Wishlist.tsx"));
const Compare = lazy(() => import("./pages/Compare.tsx"));
const Account = lazy(() => import("./pages/Account.tsx"));
const MyOrders = lazy(() => import("./pages/MyOrders.tsx"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess.tsx"));
const OrderTracking = lazy(() => import("./pages/OrderTracking.tsx"));
const Checkout = lazy(() => import("./pages/Checkout.tsx"));
const Warranty = lazy(() => import("./pages/Warranty.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Shipping = lazy(() => import("./pages/Shipping.tsx"));
const Returns = lazy(() => import("./pages/Returns.tsx"));
const FAQ = lazy(() => import("./pages/FAQ.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const HelpCenter = lazy(() => import("./pages/HelpCenter.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Wholesale = lazy(() => import("./pages/Wholesale.tsx"));
const WholesaleApply = lazy(() => import("./pages/WholesaleApply.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter basename="/">
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/products/:category" element={<ProductListing />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/account" element={<Account />} />
            <Route path="/account/orders" element={<MyOrders />} />
            <Route path="/order-success/:orderId" element={<OrderSuccess />} />
            <Route path="/track/:orderId" element={<OrderTracking />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/warranty" element={<Warranty />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/wholesale" element={<Wholesale />} />
            <Route path="/wholesale/apply" element={<WholesaleApply />} />
            <Route path="/admin/products" element={<AdminGuard><AdminProducts /></AdminGuard>} />
            <Route path="/admin/products/new" element={<AdminGuard><AdminProductForm /></AdminGuard>} />
            <Route path="/admin/products/:id/edit" element={<AdminGuard><AdminProductForm /></AdminGuard>} />
            <Route path="/admin/orders" element={<AdminGuard><AdminOrders /></AdminGuard>} />
            <Route path="/admin/wholesale-leads" element={<AdminGuard><AdminWholesaleLeads /></AdminGuard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
