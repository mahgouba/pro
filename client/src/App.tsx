import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import SystemGlassWrapper from "@/components/system-glass-wrapper";
import MainDashboard from "@/components/main-dashboard";
import CardViewPage from "@/pages/card-view";
import VehicleDetailPage from "@/pages/vehicle-detail";

import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import QuotationEditPage from "@/pages/quotation-edit";
import PersonalBanks from "@/pages/banks-personal";
import CompanyBanks from "@/pages/banks-company";

interface User {
  username: string;
  role: string;
  id: number;
}

function Router({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [location] = useLocation();
  


  return (
    <div className="min-h-screen">
      <SystemGlassWrapper>
        <Switch>
          {/* Default landing page - Role-based redirect */}
          <Route path="/" component={() => {
            // Redirect different roles to appropriate pages
            if (user.role === "admin" || user.role === "inventory_manager" || user.role === "sales_director") {
              return <CardViewPage userRole={user.role} username={user.username} onLogout={onLogout} />;
            } else if (user.role === "accountant" || user.role === "bank_accountant") {
              return <MainDashboard user={user} onLogout={onLogout} />;
            } else if (user.role === "user" || user.role === "seller" || user.role === "salesperson") {
              // Regular users, sellers, and salespersons go to card view for vehicle browsing
              return <CardViewPage userRole={user.role} username={user.username} onLogout={onLogout} />;
            } else {
              // Default fallback - send to card view
              return <CardViewPage userRole={user.role} username={user.username} onLogout={onLogout} />;
            }
          }} />
          <Route path="/inventory" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
          <Route path="/quotation-creation" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
          <Route path="/quotation-management" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
          <Route path="/invoice-management" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
          <Route path="/reservations" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
          <Route path="/sold-vehicles" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
          <Route path="/financing-calculator" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
          <Route path="/financing-calculations-history" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
          <Route path="/financing-rates" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
          <Route path="/leave-requests" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
          <Route path="/attendance-management" component={() => <MainDashboard user={user} onLogout={onLogout} />} />




          <Route path="/database-management" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
          <Route path="/cars-migration" component={() => <MainDashboard user={user} onLogout={onLogout} />} />

          <Route path="/locations" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
          
          {/* Admin Routes through Main Dashboard */}
          {(user.role === "admin" || user.role === "inventory_manager" || user.role === "sales_director") && (
            <>
              <Route path="/pdf-appearance" component={() => <MainDashboard user={user} onLogout={onLogout} />} />


              <Route path="/user-management" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
              <Route path="/bank-management" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
              <Route path="/database-management" component={() => <MainDashboard user={user} onLogout={onLogout} />} />


              <Route path="/bank-management-full" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
              <Route path="/specifications-management" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
              <Route path="/appearance-settings" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
              <Route path="/dropdown-options-management" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
            </>
          )}

          {/* External Pages - separate routes */}
          <Route path="/cards" component={() => <CardViewPage userRole={user.role} username={user.username} onLogout={onLogout} />} />
          <Route path="/card-view" component={() => <CardViewPage userRole={user.role} username={user.username} onLogout={onLogout} />} />
          <Route path="/price-cards" component={() => <MainDashboard user={user} onLogout={onLogout} />} />
          <Route path="/banks-personal" component={PersonalBanks} />
          <Route path="/banks-company" component={CompanyBanks} />

          {/* Special Routes */}
          <Route path="/quotation-edit/:id" component={QuotationEditPage} />
          <Route path="/vehicles/:id" component={() => <VehicleDetailPage userRole={user.role} username={user.username} onLogout={onLogout} />} />
          
          <Route component={NotFound} />
        </Switch>
      </SystemGlassWrapper>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        setUser(authData);
      } catch (error) {
        localStorage.removeItem("auth");
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div dir="rtl" className="font-arabic">
            <Toaster />
            <PublicRouter onLogin={handleLogin} user={user} onLogout={handleLogout} />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function PublicRouter({ onLogin, user, onLogout }: { onLogin: (user: User) => void; user: User | null; onLogout: () => void }) {
  const [location] = useLocation();
  
  // Public routes that don't require authentication
  const publicRoutes = ['/banks-personal', '/banks-company'];
  
  // Check if current route is public
  if (publicRoutes.includes(location)) {
    return (
      <div className="min-h-screen">
        <SystemGlassWrapper>
          <Switch>
            <Route path="/banks-personal" component={PersonalBanks} />
            <Route path="/banks-company" component={CompanyBanks} />
            <Route component={NotFound} />
          </Switch>
        </SystemGlassWrapper>
      </div>
    );
  }
  
  // Require authentication for all other routes
  if (!user) {
    return <LoginPage onLogin={onLogin} />;
  }
  
  // User is logged in, show the full app
  return <Router user={user} onLogout={onLogout} />;
}

export default App;
