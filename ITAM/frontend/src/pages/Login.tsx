import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, LogIn, Mail, Shield, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { login, isAuthenticated, getStoredUser, setAuthSession, authFetch } from "@/lib/auth";
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
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  const storedUser = getStoredUser();
  const requirePasswordReset = !!storedUser?.must_change_password;
  if (isAuthenticated() && !requirePasswordReset) {
    return <Navigate to={getDefaultPath(storedUser?.role ?? "it_team")} replace />;
  }

  const from = (location.state as { from?: string } | null)?.from;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
      if (user.must_change_password) {
        setShowPasswordReset(true);
        toast.info("Please set a new password to continue.");
        return;
      }
      toast.success("Login successful");
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

  const handlePasswordReset = async (event: FormEvent) => {
    event.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Both password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    try {
      setResettingPassword(true);
      const response = await authFetch("/api/users/change_password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.detail === "string" ? payload.detail : "Failed to update password");
      }

      const currentUser = getStoredUser();
      if (currentUser) {
        setAuthSession(
          localStorage.getItem("assetBuddy.auth.accessToken") ?? "",
          localStorage.getItem("assetBuddy.auth.refreshToken") ?? "",
          { ...currentUser, must_change_password: false },
        );
      }
      toast.success("Password updated successfully");
      navigate(from && from !== "/login" ? from : getDefaultPath(currentUser?.role ?? "it_team"), { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password update failed");
    } finally {
      setResettingPassword(false);
    }
  };

  const showForcedPasswordReset = requirePasswordReset || showPasswordReset;

  return (
    <div className="relative min-h-screen w-screen overflow-hidden bg-[#F4EBD0]">
      <img
        src="/awash-login-bg.png"
        alt="Awash login background"
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center sm:object-top md:object-center lg:object-left"
      />
      {/* subtle overlay to improve form contrast on small screens */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(0,0,0,0.45),rgba(0,0,0,0.15))] lg:bg-[linear-gradient(90deg,rgba(0,0,0,0.12),rgba(0,0,0,0.0))]"
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

          {showForcedPasswordReset ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="flex items-center gap-2 text-[#5B2041]">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-semibold">Change your password</p>
              </div>
              <p className="text-sm text-gray-500">You must create a new password before continuing.</p>

              <div className="grid gap-1.5">
                <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                  New password
                </Label>
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a new password"
                  className="h-11 border-gray-200 bg-white text-sm"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                  Confirm password
                </Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="h-11 border-gray-200 bg-white text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={resettingPassword}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#C8941F] text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#B08218] disabled:opacity-60"
              >
                {resettingPassword ? "Updating password..." : "Update password"}
              </button>
            </form>
          ) : (
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
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
