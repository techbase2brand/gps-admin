"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthWrapper({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      const userEmail = localStorage.getItem("userEmail");
      
      // Static credentials check
      const STATIC_EMAIL = process.env.NEXT_PUBLIC_STATIC_EMAIL;
      
      if (isLoggedIn === "true" && userEmail === STATIC_EMAIL) {
        setIsAuthenticated(true);
      } else {
        // Clear invalid session data
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userEmail");
        router.push("/");
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated, render the protected content
  return <>{children}</>;
}
