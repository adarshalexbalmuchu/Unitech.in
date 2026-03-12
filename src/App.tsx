import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import AdminGuard from "@/components/AdminGuard";
import Index from "./pages/Index.tsx";
import ProductListing from "./pages/ProductListing.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import AdminProducts from "./pages/AdminProducts.tsx";
import AdminProductForm from "./pages/AdminProductForm.tsx";
import Login from "./pages/Login.tsx";
import SignUp from "./pages/SignUp.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/Unitech.in">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/products/:category" element={<ProductListing />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/admin/products" element={<AdminGuard><AdminProducts /></AdminGuard>} />
            <Route path="/admin/products/new" element={<AdminGuard><AdminProductForm /></AdminGuard>} />
            <Route path="/admin/products/:id/edit" element={<AdminGuard><AdminProductForm /></AdminGuard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
