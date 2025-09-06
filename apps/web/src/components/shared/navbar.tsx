import Link from "next/link";
import { Shield } from "lucide-react";

interface NavbarProps {
  showBackToHome?: boolean;
  showAuthLinks?: boolean;
}

export function Navbar({
  showBackToHome = false,
  showAuthLinks = true,
}: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            <span className="text-lg sm:text-xl font-bold text-white">
              Dead Man's Switch
            </span>
          </Link>

          <nav className="flex items-center space-x-3 sm:space-x-4 md:space-x-8">
            {showBackToHome && (
              <Link
                href="/"
                className="hover:text-gray-300 transition-colors text-xs sm:text-sm md:text-base text-gray-300"
              >
                ← Back to Home
              </Link>
            )}

            {showAuthLinks && (
              <>
                <a
                  href="/#about"
                  className="hover:text-gray-300 transition-colors text-xs sm:text-sm md:text-base text-white"
                >
                  About
                </a>
                <a
                  href="/#pricing"
                  className="hover:text-gray-300 transition-colors text-xs sm:text-sm md:text-base text-white"
                >
                  Pricing
                </a>
                <Link
                  href="/auth/login"
                  className="bg-blue-600 hover:bg-blue-700 px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm md:text-base font-medium transition-colors text-white"
                >
                  Login
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
