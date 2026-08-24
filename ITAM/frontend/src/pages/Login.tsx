import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, LogIn, Mail, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { login, isAuthenticated, getStoredUser } from "@/lib/auth";
import { getDefaultPath } from "@/lib/permissions";
import { toast } from "sonner";

const REMEMBER_EMAIL_KEY = "awash-remember-email";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(
    () => localStorage.getItem(REMEMBER_EMAIL_KEY) ?? "",
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    () => !!localStorage.getItem(REMEMBER_EMAIL_KEY),
  );
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated()) {
    const user = getStoredUser();
    return <Navigate to={getDefaultPath(user?.role ?? "it_team")} replace />;
  }

  const from = (location.state as { from?: string } | null)?.from;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
      toast.success("Login successful");
      const user = getStoredUser();
      navigate(
        from && from !== "/login" ? from : getDefaultPath(user?.role ?? "it_team"),
        { replace: true },
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#F4EBD0]">
      <img
        src="/awash-login-bg.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-left"
      />
      <div className="relative grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        {/* Left panel — background branding visible */}
        <div className="hidden lg:block" aria-hidden="true" />

        {/* Right panel — login form sits in the burgundy area */}
        <div className="flex h-full items-center justify-center px-6 py-10 sm:px-10 lg:px-8 xl:px-12">
          <div className="w-full max-w-[380px] rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          {/* Brand header */}
          <div className="mb-5 flex flex-col items-center text-center">
            <img
              src="/awash-logo.png"
              alt="Awash Wine — Since 1936"
              className="mb-3 h-auto w-44 object-contain"
            />
            <p className="font-serif text-base font-semibold text-[#5B2041]">
              IT Asset Management
            </p>
          </div>

          {/* Welcome */}
          <div className="mb-6 text-center">
            <h1 className="font-serif text-[1.75rem] font-bold leading-tight text-[#2D2D2D]">
              Welcome Back
            </h1>
            <p className="mt-1 text-sm text-gray-500">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-11 border-gray-200 bg-white pl-10 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 border-gray-200 bg-white pl-10 pr-10 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="border-gray-300 data-[state=checked]:border-[#C8941F] data-[state=checked]:bg-[#C8941F]"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm font-medium text-[#6B2D5B] hover:text-[#5B2041] hover:underline"
                onClick={() =>
                  toast.info("Please contact your IT administrator to reset your password.")
                }
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#C8941F] text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#B08218] disabled:opacity-60"
            >
              {submitting ? (
                "Signing in..."
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-gray-400">
              <Shield className="h-3.5 w-3.5" />
              Role-based access (RBAC)
            </p>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
