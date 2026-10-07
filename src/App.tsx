import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "./components/ScrollToTop";
import Analytics from "./components/Analytics";
import PageLoader from "./components/PageLoader";
// The landing page is the paid-traffic entry point — import it eagerly so it
// paints instantly. Every other route is code-split (lazy) so the home's JS
// bundle stays small and doesn't ship the planner/items/kadala code upfront.
import Index from "./pages/Index.tsx";

const Items = lazy(() => import("./pages/Items.tsx"));
const ItemDetail = lazy(() => import("./pages/ItemDetail.tsx"));
const Kadala = lazy(() => import("./pages/Kadala.tsx"));
const Cosmetics = lazy(() => import("./pages/Cosmetics.tsx"));
const Myriam = lazy(() => import("./pages/Myriam.tsx"));
const Shen = lazy(() => import("./pages/Shen.tsx"));
const Classes = lazy(() => import("./pages/Classes.tsx"));
const ClassDetail = lazy(() => import("./pages/ClassDetail.tsx"));
const Planner = lazy(() => import("./pages/Planner.tsx"));
const Builds = lazy(() => import("./pages/Builds.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Analytics />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/items" element={<Items />} />
            <Route path="/items/:slug" element={<ItemDetail />} />
            <Route path="/kadala" element={<Kadala />} />
            <Route path="/cosmetics" element={<Cosmetics />} />
            <Route path="/myriam" element={<Myriam />} />
            <Route path="/shen" element={<Shen />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/classes/:slug" element={<ClassDetail />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/builds" element={<Builds />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
