import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Layout/sidebar";
import { MobileNav } from "@/components/Layout/mobile-nav";
import Dashboard from "@/pages/dashboard";
import Schedule from "@/pages/schedule";
import Officers from "@/pages/officers";
import Reports from "@/pages/reports";
import { Login } from "@/pages/login";
import NotFound from "@/pages/not-found";
import { isLoggedIn, getCurrentUser } from "@/lib/api";

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType, allowedRoles?: string[] }) {
    const [, navigate] = useLocation();
    const user = getCurrentUser();

    useEffect(() => {
        if (!isLoggedIn()) {
            navigate("/login");
            return;
        }

        if (allowedRoles && !allowedRoles.includes(user.rol)) {
            navigate("/schedule");
        }
    }, [navigate, user.rol, allowedRoles]);

    if (!isLoggedIn()) return null;
    if (allowedRoles && !allowedRoles.includes(user.rol)) return null;

    return <Component />;
}

function Router() {
    return (
        <Switch>
            <Route path="/login" component={Login} />
            <Route path="/" component={() => <ProtectedRoute component={Dashboard} allowedRoles={["Administrador", "Supervisor"]} />} />
            <Route path="/schedule" component={() => <ProtectedRoute component={Schedule} />} />
            <Route path="/officers" component={() => <ProtectedRoute component={Officers} allowedRoles={["Administrador", "Supervisor"]} />} />
            <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
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

                    <div className="h-screen flex overflow-hidden bg-gray-50">
                        <Sidebar />
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                            <MobileNav />
                            <main className="flex-1 overflow-auto">
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
