import { useEffect } from "react";
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

function AutoSessionTimeout() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const getSettings = () => {
      try {
        return JSON.parse(window.localStorage.getItem('itam_settings') ?? '{}');
      } catch {
        return {};
      }
    };

    const logout = () => {
      window.localStorage.removeItem('assetBuddy.auth.accessToken');
      window.localStorage.removeItem('assetBuddy.auth.refreshToken');
      window.localStorage.removeItem('assetBuddy.auth.user');
      window.location.href = '/ITAM/login';
    };

    let timeoutHandle: number | undefined;

    const resetTimer = () => {
      if (typeof timeoutHandle !== 'undefined') {
        window.clearTimeout(timeoutHandle);
      }

      const settings = getSettings();
      if (settings.autoTimeout !== true) {
        return;
      }

      const minutes = Number(settings.sessionTimeout ?? 30);
      const timeoutMs = Number.isFinite(minutes) && minutes > 0 ? minutes * 60 * 1000 : 30 * 60 * 1000;
      timeoutHandle = window.setTimeout(logout, timeoutMs);
    };

    const events: Array<keyof WindowEventMap> = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer));
    resetTimer();

    return () => {
      if (typeof timeoutHandle !== 'undefined') {
        window.clearTimeout(timeoutHandle);
      }
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, []);

  return null;
}

function NormalizeBasePath() {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    if (url.pathname === '/ITAM' || url.pathname === '/ITAM') {
      url.pathname = '/ITAM/';
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }

  return null;
}

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

function LoginRoute() {
  if (isAuthenticated()) {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("assetBuddy.auth.user") ?? "null");
      if (user?.must_change_password) {
        return <Login />;
      }
    }
    const role: UserRole = getCurrentUserRole();
    return <Navigate to={getDefaultPath(role)} replace />;
  }

  return <Login />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/ITAM">
          <NormalizeBasePath />
          <AutoSessionTimeout />
          <CommandPalette />
          <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/" element={<ProtectedRoute path="/"><Index /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute path="/dashboard"><Index /></ProtectedRoute>} />
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

