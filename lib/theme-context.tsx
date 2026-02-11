'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

// Helper to safely get initial theme from document class (set by blocking script)
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  
  // Check if blocking script already set the class
  if (document.documentElement.classList.contains('light')) return 'light';
  if (document.documentElement.classList.contains('dark')) return 'dark';
  
  return 'dark'; // Fallback
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize from actual DOM state to avoid hydration mismatch
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Note: No need to sync theme from DOM here - useState already 
    // initializes from getInitialTheme() which reads the DOM class
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Update document class and localStorage with error handling
    try {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      
      localStorage.setItem('theme', theme);
    } catch (error) {
      // Handle SecurityError (private browsing) or QuotaExceededError
      console.warn('Failed to persist theme preference:', error);
    }
    
    // Update meta theme-color for mobile browsers
    try {
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#ffffff');
      }
    } catch (error) {
      console.warn('Failed to update theme-color meta tag:', error);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // FIXED: Render children immediately to avoid hydration mismatch
  // The blocking script in layout ensures correct initial theme class
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}