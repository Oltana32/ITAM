import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { CommandPalette } from "@/components/CommandPalette";
import Index from "./pages/Index";
import Assets from "./pages/Assets";
import Users from "./pages/Users";
import Locations from "./pages/Locations";
import Maintenance from "./pages/Maintenance";
import Software from "./pages/Software";
import Reports from "./pages/Reports";
import Audits from "./pages/Audits";
import Manufacturers from "./pages/Manufacturers";
import Assignments from "./pages/Assignments";
import Notifications from "./pages/Notifications";
import SettingsPage from "./pages/SettingsPage";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { getCurrentUserRole, UserRole } from "./lib/authRole";
import { canAccessPath, getDefaultPath } from "./lib/permissions";
import { isAuthenticated } from "./lib/auth";

const queryClient = new QueryClient();

function ProtectedRoute({ path, children }: { path: string; children: JSX.Element }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: path }} />;
  }
  const role: UserRole = getCurrentUserRole();
  if (!canAccessPath(role, path)) {
    return <Navigate to={getDefaultPath(role)} replace />;
  }
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CommandPalette />
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute path="/"><Index /></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute path="/assets"><Assets /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute path="/users"><Users /></ProtectedRoute>} />
          <Route path="/locations" element={<ProtectedRoute path="/locations"><Locations /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute path="/maintenance"><Maintenance /></ProtectedRoute>} />
          <Route path="/software" element={<ProtectedRoute path="/software"><Software /></ProtectedRoute>} />
          <Route path="/assignments" element={<ProtectedRoute path="/assignments"><Assignments /></ProtectedRoute>} />
          <Route path="/audits" element={<ProtectedRoute path="/audits"><Audits /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute path="/reports"><Reports /></ProtectedRoute>} />
          <Route path="/manufacturers" element={<ProtectedRoute path="/manufacturers"><Manufacturers /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute path="/notifications"><Notifications /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute path="/settings"><SettingsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute path="/profile"><Profile /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
