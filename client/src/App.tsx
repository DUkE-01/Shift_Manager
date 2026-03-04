import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import Dashboard from "@/pages/dashboard";
import Schedule from "@/pages/schedule";
import Officers from "@/pages/officers";
import Reports from "@/pages/reports";
import { Login } from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Dashboard} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/officers" component={Officers} />
      <Route path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isLoginPage = location === "/login";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!isLoginPage ? (
          <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex-col min-w-0">
              <MobileNav />
              <main className="flex-1 overflow-hidden">
                <Router />
              </main>
            </div>
          </div>
        ) : (
          <Router />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;