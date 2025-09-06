import { LoginClientWrapper } from "@/components/auth/login-client-wrapper";
import { Navbar } from "@/components/shared/navbar";

// Server Component for SEO and initial render
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Shared navigation component */}
      <Navbar showBackToHome={true} showAuthLinks={false} />

      {/* Main content - client-side only to avoid SSR issues */}
      <LoginClientWrapper />
    </div>
  );
}
