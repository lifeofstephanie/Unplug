"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  LogOut, 
  Loader2,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-500)]" />
      </div>
    );
  }

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Courses", href: "/dashboard/courses", icon: BookOpen },
    { name: "Users", href: "/dashboard/users", icon: Users },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-[#0f172a] shadow-xl border-r border-gray-100 dark:border-gray-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center px-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)]">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="ml-3 text-lg font-bold text-[var(--color-brand-700)] dark:text-white">
            Unplug Admin
          </span>
          <button 
            className="ml-auto lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] dark:bg-gray-800 dark:text-[var(--color-brand-300)]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive
                      ? "text-[var(--color-brand-600)] dark:text-[var(--color-brand-400)]"
                      : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)] dark:bg-gray-800 dark:text-[var(--color-brand-300)] font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">{user.email}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="group flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400 group-hover:text-red-600" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header (Mobile mainly, but provides a nice framing) */}
        <header className="flex h-16 items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-[#0f172a]/50 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1"></div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-[#090e17] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
