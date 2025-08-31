"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { Button } from "./card";

interface User {
  id: string;
  email?: string;
  tier: string;
}

interface NavbarProps {
  user?: User | null;
  onLogout?: () => void;
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Navbar({
  user,
  onLogout,
  onMobileMenuToggle,
  isMobileMenuOpen,
}: NavbarProps) {
  const router = useRouter();

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center space-x-2"
          >
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              Dead Man's Switch
            </span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              // Logged in navigation
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/pricing"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Pricing
                </Link>

                {/* User info */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {user.email || "User"}
                  </span>
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                    {user.tier}
                  </span>
                  <button
                    onClick={onLogout}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              // Logged out navigation
              <>
                <Link
                  href="#features"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="#pricing"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  How it Works
                </Link>
                <Button
                  onClick={() => router.push("/auth/login")}
                  variant="primary"
                  size="sm"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            {user ? (
              <button
                onClick={onMobileMenuToggle}
                className="text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
              >
                {isMobileMenuOpen ? "Close" : "Menu"}
              </button>
            ) : (
              <Button
                onClick={() => router.push("/auth/login")}
                variant="primary"
                size="sm"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
