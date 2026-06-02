"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api";
import { BookOpen, Lock, Mail, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });
      
      // Since this is the admin dashboard, ensure they are an admin
      if (data.user.role !== "admin") {
        setError("Unauthorized access. Admin privileges required.");
        setIsLoading(false);
        return;
      }

      login(data.accessToken, data.refreshToken, data.user);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Login failed. Please check your credentials."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--color-brand-100)] via-[var(--background)] to-[var(--color-brand-50)] dark:from-[var(--background)] dark:via-[#0c1322] dark:to-[#111a30] p-4">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-brand-300)] opacity-20 mix-blend-multiply blur-3xl filter dark:opacity-10"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 translate-x-1/2 translate-y-1/2 rounded-full bg-[var(--color-brand-500)] opacity-20 mix-blend-multiply blur-3xl filter dark:opacity-10"></div>

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl glass shadow-xl transition-all">
        <div className="p-8">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Unplug Admin
            </h1>
            <p className="mt-2 text-sm text-[var(--color-brand-700)] dark:text-[var(--color-brand-300)] font-medium">
              Manage courses and content
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-[var(--foreground)]"
              >
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-white/50 p-3 pl-10 text-[var(--foreground)] placeholder-gray-400 backdrop-blur-sm transition-colors focus:border-[var(--color-brand-500)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-800/50 dark:focus:bg-gray-800"
                  placeholder="admin@unplug.edu"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[var(--foreground)]"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-white/50 p-3 pl-10 text-[var(--foreground)] placeholder-gray-400 backdrop-blur-sm transition-colors focus:border-[var(--color-brand-500)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-800/50 dark:focus:bg-gray-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-[var(--color-brand-700)] p-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-brand-800)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:focus:ring-offset-gray-900 shadow-md hover:shadow-lg transform active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
