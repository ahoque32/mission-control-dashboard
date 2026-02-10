'use client';

import { useAuth } from '../lib/auth-context';
import LoginPage from './LoginPage';

/**
 * AuthGate wraps the dashboard content.
 * Shows a login page if the user is not authenticated.
 * Shows a loading spinner while checking auth state.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Loading state — show minimal spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#333] border-t-[#ededed] rounded-full animate-spin" />
          <span className="text-sm text-[#888]">Loading...</span>
        </div>
      </div>
    );
  }

  // Not authenticated — show login page
  if (!user) {
    return <LoginPage />;
  }

  // Authenticated — render the dashboard
  return <>{children}</>;
}
