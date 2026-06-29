import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Lock, LogIn } from "lucide-react";
import awashLogo from "@/assets/awash-wine-logo.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login, isAuthenticated, getStoredUser } from "@/lib/auth";
import { getDefaultPath } from "@/lib/permissions";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated()) {
    const user = getStoredUser();
    return <Navigate to={getDefaultPath(user?.role ?? 'it_team')} replace />;
  }

  const from = (location.state as { from?: string } | null)?.from;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success("Login successful");
      const user = getStoredUser();
      navigate(from && from !== '/login' ? from : getDefaultPath(user?.role ?? 'it_team'), { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl border-border/60">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <img src={awashLogo} alt="Awash Wine" className="h-10 w-10 rounded-lg object-contain" />
            <div>
              <CardTitle className="text-xl">Asset Buddy</CardTitle>
              <p className="text-sm text-muted-foreground">Sign in to continue</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@awashwine.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : <><LogIn className="mr-2 h-4 w-4" />Sign in</>}
            </Button>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" /> Access is role-based (RBAC).
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
