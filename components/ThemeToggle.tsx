'use client';

/**
 * ThemeToggle Component
 * Toggle button to switch between light and dark themes
 * Features:
 * - Sun/Moon icon animation
 * - Smooth transitions
 * - Accessible button with proper aria labels
 */

import { useTheme } from '../lib/theme-context';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        relative inline-flex items-center justify-center
        w-9 h-9 rounded-lg
        glass-card
        hover:bg-background-secondary
        active:scale-95
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-accent/20
        group
      "
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-pressed={theme === 'dark'}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      type="button"
    >
      {/* Sun Icon - visible in dark mode */}
      <svg
        className={`
          absolute w-4 h-4 text-status-warning
          transition-all duration-300 ease-out
          ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-45 scale-75'}
        `}
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
      </svg>

      {/* Moon Icon - visible in light mode */}
      <svg
        className={`
          absolute w-4 h-4 text-foreground-secondary
          transition-all duration-300 ease-out
          ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-45 scale-75'}
        `}
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
          clipRule="evenodd"
        />
      </svg>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 rounded-lg bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </button>
  );
}